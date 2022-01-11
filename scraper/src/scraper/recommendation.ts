import axios from "axios";
import { Account } from "../neo4jWrapper/index";
import { Transfer, Response } from "./types";
import { Payload } from "./types";
import dotenv from "dotenv";
dotenv.config({
    path: "./src/.env",
});

//given list of user accounts, computes distance from root user
async function rankResults(currentUser: Account, listOfUsers: Account[]) {
    const distanceMetrics = [];
    for (const similarUser of listOfUsers) {
        distanceMetrics.push(
            computeDistanceAccounts(similarUser.address, currentUser.address)
        );
    }
    distanceMetrics.sort();
    return distanceMetrics.slice(0, 5);
}

async function getTransactionsWithPagination(payload: Payload) {
    const transfers: Transfer[] = [];
    const transactionsA = await axios.post<Response>(
        `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        payload
    );
    //do stuff for pagination
    return transactionsA.data.result.transfers;
}

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
            ((accountOne.value - accountTwo.value) /
                (accountOne.value + accountTwo.value))
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
    //do a pairwise comparison
    for (let i = 0; i < Math.min(transferA.length, transferB.length); i++) {
        const transferOne = transferA[i];
        const transferTwo = transferB[i];
        dist += calcDifferenceAccounts(transferOne, transferTwo);
    }
    return dist;
}

async function computeDistanceAccounts(userA: string, userB: string) {
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
    const transfersA = await getTransactionsWithPagination(payload);
    payload.params[0].fromAddress = userB;
    const transfersB = await getTransactionsWithPagination(payload);
    return computeDistanceTransfers(transfersA, transfersB);
}
