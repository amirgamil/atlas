const nodefetch = require("node-fetch");
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

class Scraper {
  block: number;
  range: number;
  accountTypeCache: { [key: string]: AccountType };

  constructor(startBlock: number, blockRange: number) {
    this.block = startBlock;
    this.range = blockRange; // size of block range
    this.accountTypeCache = {};
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
      "https://eth-mainnet.alchemyapi.io/v2/ZgihkMdrhmQNZJWJM2TLRNWez_AA5Jzo",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    const results = await res.json();
    return results.map((r: any) => r.result === "0x");
  }

  async next() {
    const res = await nodefetch(
      "https://eth-mainnet.alchemyapi.io/v2/ZgihkMdrhmQNZJWJM2TLRNWez_AA5Jzo",
      {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getAssetTransfers",
          params: [
            {
              fromBlock: "0x" + this.block.toString(16),
              toBlock: "0x" + (this.block + this.range - 1).toString(16), // -1 since this is inclusive!
              category: ["external", "internal", "token"],
            },
          ],
        }),
      }
    );

    const r = (await res.json()) as Response;

    if (r.result === undefined) {
        throw ({code: 'caught up with head'})
    }

    let out = r.result.transfers;
    let pageKey = r.result.pageKey;

    while (pageKey != undefined) {
      const result = await nodefetch(
        "https://eth-mainnet.alchemyapi.io/v2/ZgihkMdrhmQNZJWJM2TLRNWez_AA5Jzo",
        {
          method: "POST",
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "alchemy_getAssetTransfers",
            params: [
              {
                pageKey: r.result.pageKey,
                fromBlock: "0x" + this.block.toString(16),
                toBlock: "0x" + (this.block + this.range - 1).toString(16),
                category: ["external", "internal", "token"],
              },
            ],
          }),
        }
      );
      const j = (await result.json()) as Response;
      out = out.concat(j.result.transfers);
      pageKey = j.result.pageKey;
    }

    this.block = this.block + this.range;

    return out;
  }

  async run(callback: Function) {
    while (true) {
      console.log(
        `Getting blocks ${this.block} to ${this.block + this.range - 1}`
      );
      try {
        const res = await this.next();
        const tos = res.map((r) => r.to);
        const froms = res.map((r) => r.from);
        const addrs = tos.concat(froms);
        const filtered = addrs.filter(
          (addr) => !(addr in this.accountTypeCache)
        );
        await this.setAccountTypes(filtered);
        const promises = res.map((v, i) => callback(v, i))
        await Promise.all(promises)
      } catch (err: any) {
        if (err?.code === "Neo.TransientError.Transaction.DeadlockDetected") {
            // no delay for deadlock retry

            // TODO actually fix deadlocks, maybe use batched transactions
            console.log('hit deadlock')
            await delay(1);
        } else if (err?.code === "caught up with head") {
            // caught up with head of chain, wait a little bit
            console.log('caught up with head')
            await delay(5);
        } else {
            console.error(err)
        }
      }
    }
  }
}

async function main() {
  const s = new Scraper(13975940, 1);
  s.run(async (tx: Transfer, i: number) => {
    const session = n4j.driver.session();
    const toType = s.accountTypeCache[tx.to];
    const fromType = s.accountTypeCache[tx.from];
    await n4j.createTx(session, {
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
    });
    session.close()
  });
}

main();
