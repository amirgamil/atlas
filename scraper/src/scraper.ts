const dotenv = import("dotenv")
dotenv.config({
    path: "./scraper/.env",
})
const nodefetch = require("node-fetch");
const fs = require("fs");
const { delay } = require("./util");
const n4j = require("./neo4jWrapper/index");

interface Transfer {
  blockNum: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  erc721TokenId?: string;
  erc1155Metadata?: string;
  asset: string;
  category: string;
  rawContract: RawContract;
  method?: string;
}

interface RawContract {
  value?: string;
  address?: string;
  decimal?: string;
}

interface Response {
  result: {
    transfers: Array<Transfer>;
    pageKey: string;
  };
}

enum AccountType {
  EOA,
  Contract,
}

interface ParamData {
  fromBlock: string;
  category: string[];
  pageKey?: string;
  toBlock?: string;
  fromAddress?: string;
}

interface Payload {
  jsonrpc: string;
  method: string;
  params: ParamData[];
}

interface Signature {
  id: number;
  text_signature: string;
}

class Scraper {
  private readonly fromAddress: string | undefined;
  block: number;
  range: number;
  lastSave: number;
  saveInterval: number;
  accountTypeCache: Record<string, AccountType>;
  signatureMap: Record<string, Signature>;

  constructor(startBlock: number, blockRange: number, fromAddress?: string) {
    this.block = startBlock;
    this.range = blockRange; // size of block range
    this.accountTypeCache = {};
    this.signatureMap = {};
    this.fromAddress = fromAddress;
    this.lastSave = 0;
    this.saveInterval = blockRange * 10;
  }

  async saveCache() {
    console.log(
      "saving cache of size",
      Object.keys(this.accountTypeCache).length
    );
    fs.writeFile(
      __dirname + "/cache.json",
      JSON.stringify(this.accountTypeCache),
      (err: any) => {
        if (err) console.log(err);
      }
    );
  }

  async loadCache() {
    fs.readFile(__dirname + "/cache.json", (_: any, data: string) => {
      if (data) {
        console.log("loading cache");
        this.accountTypeCache = JSON.parse(data);
        console.log(
          "cache loaded of size",
          Object.keys(this.accountTypeCache).length
        );
      }
    });
  }

  async loadSignatureMap() {
    fs.readFile(__dirname + "/signatures.json", (_: any, data: string) => {
      if (data) {
        console.log("loading signature map");
        this.signatureMap = JSON.parse(data);
        console.log(
          "signature map loaded of size",
          Object.keys(this.signatureMap).length
        );
      }
    });
  }

  async setAccountTypes(addrs: Array<string>): Promise<Array<AccountType>> {
    // Gets account types for all addrs and stores them in the cache
    const body = addrs.map((addr) => ({
      jsonrpc: "2.0",
      method: "eth_getCode",
      id: 0,
      params: [addr],
    }));
    const res = await nodefetch(
      `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    const results = await res.json();
    const types = results.map((r: any) =>
      r.result === "0x" ? AccountType.EOA : AccountType.Contract
    );
    types.forEach((t: AccountType, i: number) => {
      this.accountTypeCache[addrs[i]] = t;
    });
    return types;
  }

  async getFunctionSignatures(txs: Array<string>): Promise<Array<string>> {
    const body = txs.map((tx) => ({
      jsonrpc: "2.0",
      method: "eth_getTransactionByHash",
      id: 0,
      params: [tx],
    }));
    const res = await nodefetch(
      `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    const results = await res.json();
    const sigs = results.map((r: any) => r.result.input.substring(0, 10));

    return sigs;
  }

  async next() {
    const payload: Payload = {
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x" + this.block.toString(16),
          category: ["external", "internal", "token"],
        },
      ],
    };
    if (this.range !== -1) {
      payload.params[0]["toBlock"] =
        "0x" + (this.block + this.range - 1).toString(16);
    }
    if (this.fromAddress) {
      payload.params[0]["fromAddress"] = this.fromAddress;
    }
    const res = await nodefetch(
      `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    const r = (await res.json()) as Response;

    if (r.result === undefined) {
      throw { code: "caught up with head" };
    }

    let out = r.result.transfers;
    let pageKey = r.result.pageKey;

    //Note
    while (pageKey != undefined) {
      const payload: Payload = {
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [
          {
            pageKey: r.result.pageKey,
            fromBlock: "0x" + this.block.toString(16),
            category: ["external", "internal", "token"],
          },
        ],
      };
      if (this.range !== -1) {
        payload.params[0]["toBlock"] =
          "0x" + (this.block + this.range - 1).toString(16);
      }
      if (this.fromAddress) {
        payload.params[0]["fromAddress"] = this.fromAddress;
      }
      const result = await nodefetch(
        `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      const j = (await result.json()) as Response;
      out = out.concat(j.result.transfers);
      pageKey = j.result.pageKey;
    }

    this.block = this.block + this.range;

    return out;
  }

  getMethodName(sig: string): string {
    if (sig in this.signatureMap) {
      return this.signatureMap[sig].text_signature;
    }
    return sig;
  }

  async run() {
    while (true) {
      console.log(
        `Getting blocks ${this.block} to ${this.block + this.range - 1}`
      );
      await this.executeOnce();
    }
  }

  mapTxData(tx: Transfer) {
    const toType = this.accountTypeCache[tx.to];
    const fromType = this.accountTypeCache[tx.from];
    return {
      category: tx.category,
      to: tx.to,
      from: tx.from,
      blockNum: tx.blockNum,
      value: tx.value,
      asset: tx.asset,
      hash: tx.hash,
      distance: 1,
      toIsUser: toType === AccountType.EOA,
      fromIsUser: fromType === AccountType.EOA,
      method: tx.method ?? ""
    };
  }

  async executeOnce() {
    try {
      const res = await this.next();
      const tos = res.map((r) => r.to);
      const froms = res.map((r) => r.from);
      const addrs = tos.concat(froms);
      const filtered = addrs.filter((addr) => !(addr in this.accountTypeCache));
      await this.setAccountTypes(filtered);

      // Add method names to transactions
      const txs = res.map((r) => r.hash);
      const signatures = await this.getFunctionSignatures(txs);
      signatures.forEach((s: string, i: number) => {
        res[i].method = this.getMethodName(s);
      });

      console.log(`inserting ${res.length} blocks`);
      await n4j.createMultipleTx(res.map(this.mapTxData.bind(this)));
    } catch (err: any) {
      console.log("Error: ", err);
      if (err?.code === "Neo.TransientError.Transaction.DeadlockDetected") {
        // no delay for deadlock retry

        // TODO actually fix deadlocks, maybe use batched transactions
        console.log("hit deadlock");
        await delay(1);
      } else if (err?.code === "caught up with head") {
        // caught up with head of chain, wait a little bit
        console.log("caught up with head");
        await delay(5);
      } else {
        console.error(err);
      }
    }
  }
}

//given list of user accounts, computes distance from root user
async function rankResults(currentUser: Account, listOfUsers: Account[]) {
    const distanceMetrics = [];
    for (const similarUser of listOfUsers) {
        distanceMetrics.push(computeDistance);
    }
}

async function computeDistance(userA: Account, userB: Account) {
    await fetch("");
}

async function launchSession(s: Scraper) {
  s.run();
}

async function fetchHistoricalDataForUser(address: string) {
  const s = new Scraper(0, -1, address);
  s.executeOnce();
}

async function main() {
  const s = new Scraper(13976050, 1);
  s.loadCache();
  s.loadSignatureMap();
  await launchSession(s);
}

main();
// fetchHistoricalDataForUser("some address");
