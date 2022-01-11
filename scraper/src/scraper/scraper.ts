import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import { delay } from "../util";
import { createMultipleTx, init } from "../neo4jWrapper/index";
import { Payload, Transfer, Response } from "./types";
dotenv.config({
    path: "./src/.env",
});

enum AccountType {
    EOA,
    Contract,
}

interface Signature {
    id: number;
    text_signature: string;
}

class Scraper {
    private readonly fromAddress: string | undefined;
    name: string;
    block: number;
    endBlock: number;
    range: number;
    lastSave: number;
    saveInterval: number;
    accountTypeCache: Record<string, AccountType>;
    signatureMap: Record<string, Signature>;

    constructor(
        name: string,
        startBlock: number,
        endBlock: number,
        blockRange: number,
        fromAddress?: string
    ) {
        this.name = name;
        this.block = startBlock;
        this.endBlock = endBlock;
        this.range = blockRange; // size of block range
        this.accountTypeCache = {};
        this.signatureMap = {};
        this.fromAddress = fromAddress;
        this.lastSave = 0;
        this.saveInterval = blockRange * 10;

        this.loadCache();
        this.loadSignatureMap();
    }

    log(...msg: any[]) {
        console.log(`[${this.name}] ${msg.join(" ")}`);
    }

    async saveCache() {
        this.log(
            "saving cache of size",
            Object.keys(this.accountTypeCache).length
        );
        fs.writeFile(
            __dirname + "/cache.json",
            JSON.stringify(this.accountTypeCache),
            (err: any) => {
                if (err) this.log(err);
            }
        );
    }

    async loadCache() {
        fs.readFile(
            __dirname + "/cache.json",
            (_: Error | null, data: Buffer) => {
                if (data) {
                    this.log("loading cache");
                    this.accountTypeCache = JSON.parse(data.toString());
                    this.log(
                        "cache loaded of size",
                        Object.keys(this.accountTypeCache).length
                    );
                }
            }
        );
    }

    async loadSignatureMap() {
        fs.readFile(
            __dirname + "/signatures.json",
            (_: Error | null, data: Buffer) => {
                if (data) {
                    this.log("loading signature map");
                    this.signatureMap = JSON.parse(data.toString());
                    this.log(
                        "signature map loaded of size",
                        Object.keys(this.signatureMap).length
                    );
                }
            }
        );
    }

    async setAccountTypes(addrs: Array<string>): Promise<Array<AccountType>> {
        // Gets account types for all addrs and stores them in the cache
        const body = addrs.map((addr) => ({
            jsonrpc: "2.0",
            method: "eth_getCode",
            id: 0,
            params: [addr],
        }));
        const res = await axios.post(
            `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            body
        );
        const results = res.data as Array<any>;
        const types = results.map((r: any) =>
            r.result === "0x" ? AccountType.EOA : AccountType.Contract
        );
        types.forEach((t: AccountType, i: number) => {
            this.accountTypeCache[addrs[i]] = t;
        });
        return types;
    }

    async getFunctionSignatures(txs: Array<string>): Promise<Array<string>> {
        const body = txs.map((tx) => ({
            jsonrpc: "2.0",
            method: "eth_getTransactionByHash",
            id: 0,
            params: [tx],
        }));
        const res = await axios.post(
            `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            body
        );

        //This is bad
        const results = res.data as Array<any>;
        const sigs = results.map((r: any) => r.result.input.substring(0, 10));

        return sigs;
    }

    async getTimestampFromBlock(blockNo: number): Promise<number> {
        const body = {
            jsonrpc: "2.0",
            method: "eth_getBlockByNumber",
            id: 0,
            params: ["0x" + blockNo.toString(16), false],
        };
        const res = await axios.post(
            `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            body
        );
        return Number(res.data.result.timestamp);
    }

    async next() {
        const payload: Payload = {
            jsonrpc: "2.0",
            method: "alchemy_getAssetTransfers",
            params: [
                {
                    fromBlock: "0x" + this.block.toString(16),
                    category: ["external", "internal", "token"],
                },
            ],
        };
        if (this.range !== -1) {
            payload.params[0]["toBlock"] =
                "0x" + (this.block + this.range - 1).toString(16);
        }
        if (this.fromAddress) {
            payload.params[0]["fromAddress"] = this.fromAddress;
        }
        const res = await axios.post<Response>(
            `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            payload
        );

        const r = res.data;

        if (r.result === undefined) {
            throw { code: "caught up with head" };
        }

        let out = r.result.transfers;
        let pageKey = r.result.pageKey;

        //Note
        while (pageKey != undefined) {
            const payload: Payload = {
                jsonrpc: "2.0",
                method: "alchemy_getAssetTransfers",
                params: [
                    {
                        pageKey: pageKey,
                        fromBlock: "0x" + this.block.toString(16),
                        category: ["external", "internal", "token"],
                    },
                ],
            };
            if (this.range !== -1) {
                payload.params[0]["toBlock"] =
                    "0x" + (this.block + this.range - 1).toString(16);
            }
            if (this.fromAddress) {
                payload.params[0]["fromAddress"] = this.fromAddress;
            }
            const result = await axios.post<Response>(
                `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
                payload
            );
            const j = result.data;
            out = out.concat(j.result.transfers);
            pageKey = j.result.pageKey;
        }

        this.block = this.block + this.range;

        return out;
    }

    getMethodName(sig: string): string {
        if (sig in this.signatureMap) {
            return this.signatureMap[sig].text_signature;
        }
        return sig;
    }

    async run() {
        while (this.block < this.endBlock) {
            this.log(
                `Getting blocks ${this.block} to ${this.block + this.range - 1}`
            );
            await this.executeOnce();
        }
        this.log("Done!");
    }

    mapTxData(tx: Transfer) {
        const toType = this.accountTypeCache[tx.to];
        const fromType = this.accountTypeCache[tx.from];
        return {
            category: tx.category,
            to: tx.to,
            from: tx.from,
            blockNum: tx.blockNum,
            value: tx.value,
            asset: tx.asset,
            hash: tx.hash,
            toIsUser: toType === AccountType.EOA,
            fromIsUser: fromType === AccountType.EOA,
            method: tx.method ?? "",
            timestamp: tx.timestamp ?? 0,
        };
    }

    async executeOnce() {
        try {
            const block = this.block;
            const timestamp = await this.getTimestampFromBlock(block);
            const res = await this.next();
            const tos = res.map((r) => r.to);
            const froms = res.map((r) => r.from);
            const addrs = tos.concat(froms);
            const filtered = addrs.filter(
                (addr) => !(addr in this.accountTypeCache)
            );
            await this.setAccountTypes(filtered);

            // Add method names to transactions
            const txs = res.map((r) => r.hash);
            const signatures = await this.getFunctionSignatures(txs);
            signatures.forEach((s: string, i: number) => {
                res[i].method = this.getMethodName(s);
                res[i].timestamp = timestamp;
            });

            this.log(`inserting ${res.length} blocks`);
            createMultipleTx(res.map(this.mapTxData.bind(this)));

            if (this.block - this.lastSave > this.saveInterval) {
                this.saveCache();
                this.lastSave = this.block;
            }
        } catch (err: any) {
            this.log("Error: ", err);
            if (
                err?.code === "Neo.TransientError.Transaction.DeadlockDetected"
            ) {
                // no delay for deadlock retry

                // TODO actually fix deadlocks, maybe use batched transactions
                this.log("hit deadlock");
                await delay(1);
            } else if (err?.code === "caught up with head") {
                // caught up with head of chain, wait a little bit
                this.log("caught up with head");
                await delay(5);
            } else {
                console.error("err");
            }
        }
    }
}

async function launchSession(s: Scraper) {
    return s.run();
}

// async function fetchHistoricalDataForUser(address: string) {
//     const s = new Scraper(0, -1, address);
//     s.executeOnce();
// }

async function main() {
    await init();
    const start = 13940000;
    const bufferRange = 10000;
    const newScraper = (i: number) =>
        launchSession(
            new Scraper(
                `${i}`,
                start + i * bufferRange,
                start + (i + 1) * bufferRange,
                1
            )
        );
    await Promise.all([1, 2, 3, 4, 5].map((i) => newScraper(i)));
}

main();
// fetchHistoricalDataForUser("some address");
