import axios from "axios";
export const delay = (s: number) =>
    new Promise((resolve) => setTimeout(resolve, s * 1000));

export const currBlock = async () => {
    const res = await axios.post(
        "https://eth-mainnet.alchemyapi.io/v2/ZgihkMdrhmQNZJWJM2TLRNWez_AA5Jzo",
        '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":0}'
    );
    const b = res.data as any;
    return Number(b.result);
};

export const blockSecondsAgo = async (s: number) => {
    // APPROXIMATE block number from s seconds ago
    // Just uses 13.1 as the average block time, so will be off by a bit
    const curr = await currBlock();
    return Math.round(curr - s / 13.1);
};
