import axios from "axios";
import { Account } from "../neo4jWrapper/index";
import { Transfer, Response } from "./types";
import { Payload } from "./types";
import dotenv from "dotenv";
dotenv.config({
    path: "./src/.env",
});

interface DistAccount {
    distance: number;
    account: Account;
}

//given list of user accounts, computes distance from root user
async function rankResults(currentUser: Account, listOfUsers: Account[]) {
    const distanceMetrics: DistAccount[] = [];
    const payload: Payload = {
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [
            {
                fromBlock: "0x0",
                fromAddress: currentUser.address,
                category: ["external", "internal", "token"],
            },
        ],
    };
    const userHistory = await getTransactionsWithPagination(payload);
    for (const similarUser of listOfUsers) {
        const dist = await computeDistanceAccounts(
            similarUser.address,
            userHistory
        );
        distanceMetrics.push({ distance: dist, account: similarUser });
    }
    distanceMetrics.sort((a: DistAccount, b: DistAccount) =>
        a.distance < b.distance ? -1 : a.distance === b.distance ? 0 : 1
    );
    return distanceMetrics.slice(0, 5);
}

async function getTransactionsWithPagination(payload: Payload) {
    const transactionsA = await axios.post<Response>(
        `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        payload
    );
    const transfers: Transfer[] = transactionsA.data.result.transfers;
    let pageKey = transactionsA.data.result.pageKey;
    while (pageKey !== undefined) {
        payload.params[0].pageKey = pageKey;
        const next = await axios.post<Response>(
            `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            payload
        );
        if (next.data.result.transfers) {
            transfers.push(...next.data.result.transfers);
        }
        pageKey = next.data.result.pageKey;
    }
    return transfers;
}

const valOr0 = (val: typeof NaN | number) => {
    return isNaN(val) ? 0 : val;
};

//calculates the difference between two transactions. Uses a weighted sum
//0.7 to address, 0.2 type of token, 0.1 value
const calcDifferenceAccounts = (accountOne: Transfer, accountTwo: Transfer) => {
    return (
        0.7 * (accountOne.to === accountTwo.to ? 0 : 1) +
        0.2 *
            (accountOne.rawContract.address === accountTwo.rawContract.address
                ? 0
                : 1) +
        0.1 *
            valOr0(
                (accountOne.value - accountTwo.value) /
                    (accountOne.value + accountTwo.value)
            )
    );
};

function computeDistanceTransfers(
    transferA: Transfer[],
    transferB: Transfer[]
): number {
    let dist = 0;
    //sort by distance to elimiate effect of order of transactions
    //FIXME: this is kind of stupid, it will work for same addresses, it will lead to weird results
    //where transactions have similar addresses but not identical
    transferA.sort((t1: Transfer, t2: Transfer) =>
        t1.to < t2.to ? -1 : t1.to === t2.to ? 0 : 1
    );
    transferB.sort((t1: Transfer, t2: Transfer) =>
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
    userA: string,
    userTransfers: Transfer[]
) {
    const payload: Payload = {
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [
            {
                fromBlock: "0x0",
                fromAddress: userA,
                category: ["external", "internal", "token"],
            },
        ],
    };
    const copyPayload = { ...payload };
    const transfersA = await getTransactionsWithPagination(copyPayload);
    return computeDistanceTransfers(transfersA, userTransfers);
}
