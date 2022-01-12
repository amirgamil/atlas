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

export const getContractName = async (addr: string) => {
    // Can only run 5/sec
    // DEPRECATED :(
    const res = await axios.post(
        `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${addr}&apiKey=GEBPWJKD7ARJVNTF6WFT77B38XH5GHQH4N`
    );
    console.log(res.data);
    return res?.data?.result[0]?.ContractName ?? "";
};

export const getContractNameScrape = async (addr: string) => {
    // Can only run 5/sec
    const res = await axios.get(`https://etherscan.io/address/${addr}`);
    const start = res.data.indexOf("<title>") + 6 + 4;
    const end = res.data.indexOf("| 0x") ?? res.data.indexOf("</title>");
    const title = res.data.substring(start, end).trim();
    return title;
};

export const getContractNameScrapeTest = async () => {
    const addresses = [
        "0x7357dc2f2b6b51c8e2c7efc728002a499d503c17",
        "0x568b907f001c43dab99dde9086ab8356784ecaa0",
        "0x5fdcca53617f4d2b9134b29090c87d01058e27e9",
        "0xf4d2888d29d722226fafa5d9b24f9164c092421e",
        "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
        "0x7357dc2f2b6b51c8e2c7efc728002a499d503c17",
        "0x5fdcca53617f4d2b9134b29090c87d01058e27e9",
        "0xf4d2888d29d722226fafa5d9b24f9164c092421e",
        "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
        "0x7357dc2f2b6b51c8e2c7efc728002a499d503c17",
        "0x5fdcca53617f4d2b9134b29090c87d01058e27e9",
        "0xf4d2888d29d722226fafa5d9b24f9164c092421e",
        "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
        "0x7357dc2f2b6b51c8e2c7efc728002a499d503c17",
        "0x5fdcca53617f4d2b9134b29090c87d01058e27e9",
        "0xf4d2888d29d722226fafa5d9b24f9164c092421e",
        "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
        "0x7357dc2f2b6b51c8e2c7efc728002a499d503c17",
        "0x5fdcca53617f4d2b9134b29090c87d01058e27e9",
        "0xf4d2888d29d722226fafa5d9b24f9164c092421e",
        "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
        "0x7357dc2f2b6b51c8e2c7efc728002a499d503c17",
        "0x5fdcca53617f4d2b9134b29090c87d01058e27e9",
    ];

    for (let i = 0; i < addresses.length; i++) {
        const d = await getContractNameScrape(addresses[i]);
        console.log(d);
        await delay(3);
    }
};
