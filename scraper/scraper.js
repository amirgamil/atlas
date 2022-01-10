const fetch = require("node-fetch");

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

async function get_erc20_transactions_for_block(blockNum) {
  const res = await fetch(
    "https://eth-mainnet.alchemyapi.io/v2/ZgihkMdrhmQNZJWJM2TLRNWez_AA5Jzo",
    {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock: "0x" + blockNum.toString(16),
            toBlock: "0x" + (blockNum + 20).toString(16),
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
              fromBlock: "0x" + blockNum.toString(16),
              toBlock: "0x" + (blockNum + 20).toString(16),
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

  console.log(out);
}

async function main() {
  await get_erc20_transactions_for_block(13973567);
}

main();
