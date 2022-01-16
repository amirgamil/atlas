import axios from "axios";
import {
  Account,
  createMultipleTx,
  executeReadQuery,
  TxI,
} from "../neo4jWrapper/index";
import { Response, AccountResponse } from "./types";
import { Payload } from "./types";
import { converter } from "../util";
import Bottleneck from "bottleneck";
import { getAccountResponse } from "../names";
import { batchCompare } from "../modularity/index";
import type { Record as Neo4jRecord } from "neo4j-driver";

// dotenv.config({
//   path: "./src/.env",
// });
console.log(process.env.ETHERSCAN_KEY);
interface DistAccount {
  distance: number;
  account: Account;
}

const limiter = new Bottleneck({
  maxConcurrent: 1000,
});

//given list of user accounts, computes distance from root user
async function rankResults(
  currentUser: Account,
  listOfUsers: Account[],
  allTxIHistory: Map<String, TxI[]>,
  userHistory?: TxI[]
) {
  const payload: Payload = {
    jsonrpc: "2.0",
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromBlock: "0x0",
        fromAddress: currentUser.addr,
        category: ["external", "internal", "token"],
        maxCount: "0x14",
      },
    ],
  };
  if (!userHistory) {
    userHistory = await getTransactionsWithPagination(payload);
  }

  const distanceMetrics = await limiter.schedule(() => {
    if (!userHistory) {
      return Promise.reject(new Error("User history should defined"));
    }
    const definedUserHist = userHistory;
    const promises: Promise<DistAccount>[] = [];

    for (const similarUser of listOfUsers) {
      const similarUserTransfers = allTxIHistory.get(similarUser.addr);

      if (similarUserTransfers) {
        promises.push(
          new Promise(async (resolve) => {
            const dist = await computeDistanceAccounts(
              similarUserTransfers,
              definedUserHist
            );
            resolve({ distance: dist, account: similarUser });
          })
        );
      }
    }
    return Promise.all(promises);
  });
  distanceMetrics.sort((a: DistAccount, b: DistAccount) =>
    a.distance < b.distance ? -1 : a.distance === b.distance ? 0 : 1
  );
  return distanceMetrics.slice(0, 100);
}

async function getTransactionsWithPagination(
  payload: Payload,
  paginate = false
): Promise<TxI[]> {
  const transactions = await axios.post<Response>(
    `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_SCRAPING_API_KEY}`,
    payload
  );

  //FIXME: I don't understand why this sometimes happens, maybe it's an Alchemy thing
  if (
    !transactions.data.result ||
    !transactions.data.result.transfers ||
    transactions.data.result.transfers.length === 0
  ) {
    return [];
  }

  await converter.setAccountTypes([transactions.data.result.transfers[0].from]);
  const transfers: TxI[] = transactions.data.result.transfers.map(
    converter.mapTxData
  );
  let pageKey = transactions.data.result.pageKey;

  let count = 0;

  //set a limit on number of paginations to prevent crashing the server
  while (pageKey !== undefined && paginate && count < 4) {
    payload.params[0].pageKey = pageKey;
    const next = await axios.post<Response>(
      `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_SCRAPING_API_KEY}`,
      payload
    );
    if (next.data.result.transfers) {
      transfers.push(...next.data.result.transfers.map(converter.mapTxData));
    }
    pageKey = next.data.result.pageKey;
    count += 1;
  }
  return transfers;
}

const valOr0 = (val: typeof NaN | number) => {
  return isNaN(val) ? 0 : val;
};

//calculates the difference between two transactions. Uses a weighted sum
//0.7 to address, 0.2 type of token, 0.1 value
const calcDifferenceAccounts = (accountOne: TxI, accountTwo: TxI) => {
  if (!accountOne.value || !accountTwo.value) {
    return 1;
  }
  //FIXME: make this more intelligent
  const val1 = accountOne.value.valueOf();
  const val2 = accountOne.value.valueOf();
  return (
    0.7 * (accountOne.to === accountTwo.to ? 0 : 1) +
    0.2 * (accountOne.asset === accountTwo.asset ? 0 : 1) +
    0.1 * valOr0((val1 - val2) / (val1 + val2))
  );
};

function computeDistanceTransfers(transferA: TxI[], transferB: TxI[]): number {
  let dist = 0;
  //sort by distance to elimiate effect of order of transactions
  //FIXME: this is kind of stupid, it will work for same addresses, it will lead to weird results
  //where transactions have similar addresses but not identical
  transferA.sort((t1: TxI, t2: TxI) =>
    t1.to < t2.to ? -1 : t1.to === t2.to ? 0 : 1
  );
  transferB.sort((t1: TxI, t2: TxI) =>
    t1.to < t2.to ? -1 : t1.to === t2.to ? 0 : 1
  );
  const minLength = Math.min(transferA.length, transferB.length);
  //do a pairwise comparison
  for (let i = 0; i < minLength; i++) {
    const transferOne = transferA[i];
    const transferTwo = transferB[i];
    dist += calcDifferenceAccounts(transferOne, transferTwo);
  }
  return dist / minLength;
}

async function computeDistanceAccounts(
  compareToTransfers: TxI[],
  userTransfers: TxI[]
): Promise<number> {
  return computeDistanceTransfers(compareToTransfers, userTransfers);
}

async function computeFriendsAndContracts(addr: string) {
  return await executeReadQuery(`MATCH (acc:User {addr: '${addr}'})-[:To]->(child:Contract)<-[:To]-(friend:User)-[otherTransaction:To]->(contract:Contract)
                                WHERE NOT (acc)-[:To]->(contract)
                                RETURN friend, otherTransaction, contract`);
}

export const generateRecommendationForAddr = async (
  addr: string
): Promise<AccountResponse[]> => {
  if (!addr) return Promise.reject([]);
  //check it exists in the graph
  const friendTxITransactions: Map<String, TxI[]> = new Map();

  //get users that have interacted the same contracts as the current address
  const res = await computeFriendsAndContracts(addr);

  if (res.records.length === 0) {
    // add current user and their transactions to the graph
    const payload: Payload = {
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          fromAddress: addr,
          category: ["external", "internal", "token"],
          maxCount: "0x14",
        },
      ],
    };
    const transactionsDate = new Date().getTime();
    const transactions = await getTransactionsWithPagination(payload, true);
    console.log(
      "[profile] finished getting transactions in ",
      new Date().getTime() - transactionsDate
    );

    // const storeInDb = new Date().getTime();
    //so we don't have to wait for this to be written in the graph database, we don't await it and try to
    //to execute the queries on the other contracts
    createMultipleTx(transactions).catch((ex) =>
      console.log("Error writing new user to the database")
    );

    return await getAndRankContractsNewUser(
      transactions,
      addr,
      friendTxITransactions
    );
  } else {
    return await getAndRankContracts(addr, res.records, friendTxITransactions);
  }
};

const getAndRankContractsNewUser = async (
  transactions: TxI[],
  addr: string,
  friendTxITransactions: Map<String, TxI[]>
) => {
  const current = new Date().getTime();
  const responses = await limiter.schedule(() => {
    const promises: Promise<Neo4jRecord[]>[] = [];
    for (const transaction of transactions) {
      //is a smart contract
      if (!transaction.toIsUser) {
        promises.push(
          new Promise<Neo4jRecord[]>(async (resolve) => {
            const res =
              await executeReadQuery(`MATCH (child:Contract { addr: '${transaction.to}'})<-[:To]-(friend:User)-[otherTransaction:To]->(contract:Contract)
                                    RETURN friend, otherTransaction, contract
                                    LIMIT 25`);

            resolve(res.records);
          })
        );
      }
    }
    return Promise.all(promises);
  });

  const result = await getAndRankContracts(
    addr.toLowerCase(),
    responses.reduce((prev, current) => [...prev, ...current], []),
    friendTxITransactions
  );
  console.log(
    "[profile] full new user flow in ",
    new Date().getTime() - current
  );
  return result;
};

//parses a single element from a graph query that looks for similar users who have interacted with
//potential smart contracts to recommend
const parseGraphResultElement = (
  el: unknown,
  friendTxITransactions: Map<String, TxI[]>,
  similarUsers: Account[]
) => {
  const neo4jReadResult = el as unknown as Neo4JReadResult;
  const fromAddressMaybe = neo4jReadResult._fields[0].properties as Account;
  const edge = neo4jReadResult._fields[1].properties as TxI;

  if (isAccount(fromAddressMaybe)) {
    similarUsers.push({
      addr: fromAddressMaybe.addr,
      isUser: true,
    });
    edge.from = fromAddressMaybe.addr;
  }

  if (neo4jReadResult._fields.length === 3) {
    edge.to = (neo4jReadResult._fields[2].properties as Account).addr;

    const maybePrevTransactions = friendTxITransactions.get(
      fromAddressMaybe.addr
    );

    if (maybePrevTransactions) {
      maybePrevTransactions.push(edge);
    } else {
      friendTxITransactions.set(fromAddressMaybe.addr, [edge]);
    }
  }
};

const recommendContractFromRanked = async (ranks: DistAccount[]) => {
  const responses = await limiter.schedule(() => {
    const promises: Promise<string[]>[] = [];

    for (const rank of ranks) {
      promises.push(
        new Promise(async (resolve) => {
          const similarSmartContracts = await executeReadQuery(
            `MATCH (acc:User {addr: '${rank.account.addr}'})-[:To]->(child:Contract)
                             RETURN child
                             LIMIT 20
                 `
          );

          const currentRecommendedSmartContracts: string[] = [];
          similarSmartContracts.records.map(async (el) => {
            const neo4jReadResult = el as unknown as Neo4JReadResult;
            const maybeAccount = neo4jReadResult._fields[0].properties;

            if (isAccount(maybeAccount)) {
              currentRecommendedSmartContracts.push(maybeAccount.addr);
            } else {
              throw new Error("should not happen");
            }
            resolve(currentRecommendedSmartContracts);
          });
        })
      );
    }
    return Promise.all(promises);
  });

  const results = [
    ...new Set(
      responses.reduce((prev: any, current: any) => {
        return [...prev, ...current];
      }, [])
    ),
  ];
  console.log("check this out: ", results.slice(0, 20));
  return Promise.all(
    results.slice(0, 20).map(async (el) => await getAccountResponse(el))
  );
};

const getAndRankContracts = async (
  addr: string,
  records: Neo4jRecord[],
  friendTxITransactions: Map<String, TxI[]>
) => {
  const similarUsers: Account[] = [];
  let currentTime = new Date().getTime();
  records.map((el) =>
    parseGraphResultElement(el, friendTxITransactions, similarUsers)
  );

  const ranks = await rankResults(
    { addr, isUser: true },
    similarUsers,
    friendTxITransactions
  );

  console.log(
    "[profile] done with ranking in ",
    new Date().getTime() - currentTime
  );
  //recommend all 20 smart contracts of the most similar users
  const contractTime = new Date().getTime();
  const recommended = await recommendContractFromRanked(ranks);
  console.log(
    "[profile] done with recommending in ",
    new Date().getTime() - contractTime
  );
  console.log(
    "[profile] done with getAndRankContracts in ",
    new Date().getTime() - currentTime
  );
  return recommended;
};

export const getSimilarContracts = async (addr: string) => {
  let res = await executeReadQuery(`
      MATCH (contract:Contract {addr: '${addr}'})-[:To]-(user:User)-[:To]-(similar:Contract)
      WHERE NOT contract = similar
      RETURN similar
      LIMIT 1
    `);
  if (res.records.length === 0) {
    const payload: Payload = {
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          contractAddress: addr,
          category: ["external", "internal", "token"],
          maxCount: "0xa",
        },
      ],
    };
    const results = await getTransactionsWithPagination(payload);
    console.log("fetched transactions similar: ", results);
    await createMultipleTx(results);
    console.log("wrote new transactions in db for similar");
  }
  res = await executeReadQuery(`
      MATCH (contract:Contract {addr: '${addr}'})-[:To]-(user:User)-[:To]-(similar:Contract)
      WHERE NOT contract = similar
      RETURN similar
      LIMIT 25
    `);
  const similar = res.records.map((r) => r.get("similar").properties.addr);
  console.log("executed query", similar);
  const addresses = Array.from(new Set(similar));
  return await batchCompare(addr, addresses);
};

export const getHotContracts = async (n: number) => {
  const res = await executeReadQuery(`
        MATCH (a: User)-[r:To]->(b: Contract)
        WHERE r.count >= 10
        RETURN b, COUNT(a) as users
        ORDER BY users DESC LIMIT 10`);
  const addresses = res.records.map((r) => ({
    addr: r.get("b").properties.addr,
    count: Number(r.get("users")),
  }));
  return addresses;
};

interface Neo4JReadResult {
  keys: string[];
  length: number;
  _fields: Fields[];
  _fieldLookup: {
    child: number;
  };
}

interface Fields {
  identity: {
    low: number;
    high: number;
  };
  labels: string[];
  properties: Account | TxI;
}

const isAccount = (val: any): val is Account => {
  return typeof val.addr === "string";
};

//kind of hacky
const isTransfer = (val: Account | TxI): val is TxI => {
  return !isAccount(val);
};

interface AccountFeedback {
  name?: string;
  isGoodRecommendation: boolean;
}

export const submitFeedback = async (
  addr: string,
  feedbackAddrs: Record<string, AccountFeedback>
) => {
  const promises: Promise<string[]>[] = [];
  const seenAddresses: Set<string> = new Set(Object.keys(feedbackAddrs));
  for (const [address, feedbackDetails] of Object.entries(feedbackAddrs)) {
    if (feedbackDetails.isGoodRecommendation && address) {
      promises.push(
        new Promise<string[]>(async (resolve) => {
          const res = await executeReadQuery(`
                MATCH (acc:Contract {addr: '${address}'})<-[:To]-(friend:User)-[otherTransaction:To]->(contract:Contract)
                RETURN contract
                LIMIT 25
            `);
          const addresses = res.records.map(
            //@ts-ignore
            (el) => el._fields[0].properties.addr
          );
          const similarContracts = await batchCompare(
            address,
            addresses.filter((addr) => !seenAddresses.has(addr))
          );
          resolve(similarContracts.filter((el) => el !== address));
        })
      );
    }
  }
  const resultsSet: Set<string> = new Set();
  (await Promise.all(promises)).map((el) =>
    el.forEach((ex) => resultsSet.add(ex))
  );
  return await Promise.all(
    [...resultsSet].slice(0, 20).map(async (el) => await getAccountResponse(el))
  );
};
