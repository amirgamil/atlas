import dotenv from "dotenv";
import neo4j from "neo4j-driver";
import { delay } from "../util";
dotenv.config({ path: "src/.env" });
export const driver = neo4j.driver(
    `${process.env.NEO4J_URI}`,
    neo4j.auth.basic(
        `${process.env.NEO4J_USER}`,
        `${process.env.NEO4J_PASSWORD}`
    )
);

export interface Account {
    address: string;
    isUser: boolean;
}

export interface TxI {
    category: String;
    to: String;
    toIsUser: Boolean;
    from: String;
    fromIsUser: Boolean;
    blockNum: String;
    value: Number;
    asset: String;
    hash: String;
    method: String;
}

async function createIndex(session: typeof neo4j.Session) {
    return session.run(
        "CREATE INDEX IF NOT EXISTS FOR (n:Account) ON (n.isUser)"
    );
}

async function createConstraints(session: typeof neo4j.Session) {
    return session.run(
        "CREATE CONSTRAINT IF NOT EXISTS ON (n:Account) ASSERT (n.addr) IS UNIQUE"
    );
}

async function nuke(session: typeof neo4j.Session) {
/*      return session
        .run("MATCH (a)-[r]->() DELETE a, r")
        .then(() => session.run("MATCH (a) DELETE a")); */
        return Promise.resolve()
}

//external: user to user
//internal: smart contract to smart contract
//anything else: user to smart contract
export async function createTx(tx: typeof neo4j.Transaction, data: TxI) {
    if (data.from === "0x0000000000000000000000000000000000000000") {
        return Promise.resolve()
    }
    data.asset = data.asset || "UNKNOWN"
    const template = `
    MERGE (a:${data.fromIsUser ? 'User' : 'Contract'} {addr: $from})
    MERGE (b:${data.toIsUser ? 'User' : 'Contract'} {addr: $to})
    MERGE p = (a)-[r:To {asset: $asset} ]->(b)
    ON CREATE SET
        r.count = 1,
        r.category = $category,
        r.blockNum = $blockNum,
        r.value = $value,
        r.method = $method,
        r.hash = $hash
    ON MATCH SET
        r.count = r.count + 1,
        r.value = r.value + $value
    RETURN p
    `;
    while(true) {
        try {
            return tx.run(template, data);
        } catch {
            await delay(1 + Math.random());
        }
    }
}

export async function createMultipleTx(data: TxI[]) {
    const session = driver.session();
    return session
        .writeTransaction((tx: typeof neo4j.Transaction) => {
            const curriedCreate = (data: TxI) => createTx(tx, data);
            return Promise.all(data.map(curriedCreate));
        })
        .finally(() => session.close());
}

export const session = driver.session();

export async function init() {
    return nuke(session)
        .then(() => createIndex(session))
        .then(() => createConstraints(session))
        .then(() => session.close())
        .then(() => console.log("Finished setup of indexes"));
}

