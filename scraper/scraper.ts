import fetch from "node-fetch";

export interface Transfer {
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
}

async function get_erc20_transactions_for_block(blockNum: number) {
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
            toBlock: "0x" + (blockNum + 100).toString(16),
            category: ["erc20"],
          },
        ],
      }),
    }
  );

  const r = (await res.json()) as Response;

  console.log(r);
  console.log(r.result.transfers[10]);
}

async function main() {
  await get_erc20_transactions_for_block(13973567);
}

main();
