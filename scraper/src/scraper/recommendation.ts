import axios from "axios";
import { Account, executeReadQuery, init, TxI } from "../neo4jWrapper/index";
import { Transfer, Response } from "./types";
import { Payload } from "./types";
import dotenv from "dotenv";
import { Converter } from "./scraper";
import { getContractNameScrape } from "../util";

dotenv.config({
    path: "./src/.env",
});

interface DistAccount {
    distance: number;
    account: Account;
}

//given list of user accounts, computes distance from root user
async function rankResults(currentUser: Account, listOfUsers: Account[]) {
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
    const userHistory = await getTransactionsWithPagination(payload);
    const promises: Promise<DistAccount>[] = [];
    for (const similarUser of listOfUsers) {
        promises.push(
            new Promise(async (resolve) => {
                const dist = await computeDistanceAccounts(
                    similarUser.addr,
                    userHistory
                );
                resolve({ distance: dist, account: similarUser });
            })
        );
    }
    const distanceMetrics = await Promise.all(promises);
    distanceMetrics.sort((a: DistAccount, b: DistAccount) =>
        a.distance < b.distance ? -1 : a.distance === b.distance ? 0 : 1
    );
    console.log("metrics: ", distanceMetrics);
    return distanceMetrics.slice(0, 100);
}

async function getTransactionsWithPagination(payload: Payload): Promise<TxI[]> {
    const transactions = await axios.post<Response>(
        `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        payload
    );

    if (!transactions.data.result.transfers) {
        console.log("uh oh: ", transactions.data.result);
    }

    const transfers: TxI[] = transactions.data.result.transfers.map(
        converter.mapTxData
    );
    // let pageKey = transactions.data.result.pageKey;

    //for now don't do pagination for speed
    // while (pageKey !== undefined) {
    //     payload.params[0].pageKey = pageKey;
    //     const next = await axios.post<Response>(
    //         `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
    //         payload
    //     );
    //     if (next.data.result.transfers) {
    //         transfers.push(
    //             ...next.data.result.transfers.map(converter.mapTxData)
    //         );
    //     }
    //     pageKey = next.data.result.pageKey;
    // }
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
    compareToAddress: string,
    userTransfers: TxI[]
): Promise<number> {
    const compareToTransfers = await getUserTxHistory(compareToAddress);
    return computeDistanceTransfers(compareToTransfers, userTransfers);
}

const getUserTxHistory = async (address: string): Promise<TxI[]> => {
    const transfers: TxI[] = [];
    const res =
        await executeReadQuery(`MATCH (acc:User {addr: '${address}'})-[transaction:To]->(child:Contract)
    RETURN transaction`);
    for (const edge of res.records) {
        const neo4jReadResult = edge as unknown as Neo4JReadResult;
        const maybeTransfer = neo4jReadResult._fields[0].properties;

        if (isTransfer(maybeTransfer)) {
            console.log("transfer", maybeTransfer);
            transfers.push(maybeTransfer);
        }
    }
    return transfers;
};

export const generateRecommendationForAddr = async (addr: string) => {
    //check it exists in the graph
    //await init();
    //await converter.loadCaches();
    ``;
    //get users that have interacted the same contracts as the current address
    const res =
        await executeReadQuery(`MATCH (acc:User {addr: '${addr}'})-[:To]->(child:Contract)<-[:To]-(friend:User)
                                RETURN friend`);
    if (res.records.length < 2) {
        //Do stuff to query current user and add their friends to the graph
        return new Set();
    } else {
        const similarUsers: Account[] = res.records.map((el) => {
            const neo4jReadResult = el as unknown as Neo4JReadResult;
            const maybeAccount = neo4jReadResult._fields[0].properties;

            if (isAccount(maybeAccount)) {
                return { addr: maybeAccount.addr };
            } else {
                throw new Error("Should have been an account");
            }
        });
        const ranks = await rankResults({ addr }, similarUsers);
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
                        const neo4jReadResult =
                            el as unknown as Neo4JReadResult;
                        const maybeAccount =
                            neo4jReadResult._fields[0].properties;

                        if (isAccount(maybeAccount)) {
                            const name = await getContractNameScrape(
                                maybeAccount.addr
                            );
                            if (
                                name ===
                                '<!doctype html>\n<html lang="en">\n<head><title>'
                            ) {
                                currentRecommendedSmartContracts.push(
                                    maybeAccount.addr
                                );
                            } else {
                                currentRecommendedSmartContracts.push(name);
                            }
                        } else {
                            throw new Error("should not happen");
                        }
                        resolve(currentRecommendedSmartContracts);
                    });
                })
            );
        }
        const responses = await Promise.all(promises);
        console.log("done");
        return [
            ...new Set(
                responses.reduce((prev, current) => {
                    return [...prev, ...current];
                }, [])
            ),
        ];
    }
};

const converter = new Converter();

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
