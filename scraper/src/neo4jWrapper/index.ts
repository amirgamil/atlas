require("dotenv").config({
    path: "./scraper/src/neo4jWrapper/.env",
});
const neo4j = require("neo4j-driver");
const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
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
    distance: Number;
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
    return session
        .run("MATCH (a)-[r]->() DELETE a, r")
        .then(() => session.run("MATCH (a) DELETE a"));
}
//external: user to user
//internal: smart contract to smart contract
//anything else: user to smart contract
async function createTx(tx: typeof neo4j.Transaction, data: TxI) {
    const template = `
    MERGE (a:Account {addr: $from})
    MERGE (b:Account {addr: $to})
    SET a.isUser = ${data.fromIsUser}
    SET b.isUser = ${data.toIsUser}
    CREATE p = (a)-[:To { category: $category, blockNum: $blockNum, value: $value, asset: $asset, hash: $hash, distance: $distance}]->(b)
    RETURN p
    `;
    return tx.run(template, data);
}

async function createMultipleTx(data: TxI[]) {
    const session = driver.session();
    return session
        .writeTransaction((tx: typeof neo4j.Transaction) => {
            const curriedCreate = (data: TxI) => createTx(tx, data);
            return Promise.all(data.map(curriedCreate));
        })
        .finally(() => session.close());
}

const session = driver.session();
nuke(session)
    .then(() => createIndex(session))
    .then(() => createConstraints(session))
    .then(() => session.close())
    .then(() => console.log("Finished setup of indexes"));

module.exports = {
    session,
    createTx,
    createMultipleTx,
    driver,
};
