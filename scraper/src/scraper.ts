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

class Scraper {
  block: number;
  range: number;

  constructor(startBlock: number, blockRange: number) {
    this.block = startBlock;
    this.range = blockRange; // size of block range
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
        console.log(res.length);
        for (let i = 0; i < res.length; i++) {
          await callback(res[i], i);
        }
      } catch {
        // this.block + this.range - 1 is greater than the block height
        await delay(5);
      }
    }
  }
}

async function main() {
  const s = new Scraper(13975360, 1);
  const session = n4j.driver.session();
  s.run(async (tx: Transfer, i: Number) => {
    await n4j.createTx(session, {
      category: tx.category,
      to: tx.to,
      from: tx.from,
      blockNum: tx.blockNum,
      value: tx.value,
      asset: tx.asset,
      hash: tx.hash,
      distance: 1,
    });
  });
}

main();
