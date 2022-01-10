const nodefetch = require("node-fetch");

const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

const currBlock = async () => {
  const res = await nodefetch(
    "https://eth-mainnet.alchemyapi.io/v2/ZgihkMdrhmQNZJWJM2TLRNWez_AA5Jzo",
    {
      method: "POST",
      body: '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":0}',
    }
  );
  const b = await res.json();
  return Number(b.result);
};

const blockSecondsAgo = async (s) => {
  // APPROXIMATE block number from s seconds ago
  // Just uses 13.1 as the average block time, so will be off by a bit
  const curr = await currBlock();
  return Math.round(curr - s / 13.1);
};

module.exports = {
  delay,
  currBlock,
  blockSecondsAgo,
};
