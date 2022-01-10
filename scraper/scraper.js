const fetch = require("node-fetch");
const { delay } = require("./util");

/* export interface Transfer {
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

export interface RawContract {
  value?: string;
  address?: string;
  decimal?: string;
}

export interface Response {
  result: {
    transfers: Array<Transfer>;
    pageKey: string;
  };
} */

class Scraper {
  constructor(startBlock, blockRange) {
    this.block = startBlock;
    this.range = blockRange; // size of block range
  }

  async next() {
    const res = await fetch(
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
              category: ["erc20"],
            },
          ],
        }),
      }
    );

    const r = await res.json();

    let out = r.result.transfers;
    let pageKey = r.result.pageKey;

    while (pageKey != undefined) {
      const result = await fetch(
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
                category: ["erc20"],
              },
            ],
          }),
        }
      );
      const j = await result.json();
      out = out.concat(j.result.transfers);
      pageKey = j.result.pageKey;
    }

    this.block = this.block + this.range;

    return out;
  }

  async run() {
    while (true) {
      console.log(
        `Getting blocks ${this.block} to ${this.block + this.range - 1}`
      );
      try {
        const res = await this.next();
        console.log(res.length);
      } catch {
        await delay(10);
      }
    }
  }
}

async function main() {
  const s = new Scraper(13975145, 1);
  s.run();
}

main();
