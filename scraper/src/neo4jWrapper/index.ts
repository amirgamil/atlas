require("dotenv").config({
    path: "./scraper/src/neo4jWrapper/.env",
});
const neo4j = require("neo4j-driver");
const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

interface TxI {
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
    return session.run("CREATE INDEX IF NOT EXISTS FOR (n:Account) ON (n.isUser)")
}

async function createConstraints(session: typeof neo4j.Session) {
    return session.run("CREATE CONSTRAINT IF NOT EXISTS ON (n:Account) ASSERT (n.addr) IS UNIQUE");
}

async function nuke(session: typeof neo4j.Session) {
    return session
        .run("MATCH (a)-[r]->() DELETE a, r")
        .then(() => session.run("MATCH (a) DELETE a"));
}
//external: user to user
//internal: smart contract to smart contract
//anything else: user to smart contract
async function createTx(session: typeof neo4j.Session, data: TxI) {
    const template = `
    MERGE (a:Account {addr: $from})
    MERGE (b:Account {addr: $to})
    SET a.isUser = ${data.fromIsUser}
    SET b.isUser = ${data.toIsUser}
    CREATE p = (a)-[:To { category: $category, blockNum: $blockNum, value: $value, asset: $asset, hash: $hash, distance: $distance}]->(b)
    RETURN p
    `;
    return session.run(template, data);
}

const session = driver.session();
nuke(session)
    .then(() => createIndex(session))
    .then(() => createConstraints(session))
    .then(() =>
        createTx(session, {
            category: "external",
            from: "0xabc",
            to: "0xdef",
            blockNum: "0x000",
            value: 0.23,
            asset: "ETH",
            hash: "0xfff",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() =>
        createTx(session, {
            category: "token",
            from: "0xabc",
            to: "0x123",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() =>
        createTx(session, {
            category: "external",
            to: "0xabc",
            from: "0x423",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() =>
        createTx(session, {
            category: "external",
            to: "0x204",
            from: "0x423",
            blockNum: "0x231",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() =>
        createTx(session, {
            category: "token",
            to: "0x204",
            from: "0x223",
            blockNum: "0x191",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() =>
        createTx(session, {
            category: "token",
            to: "0xabc",
            from: "0x223",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() =>
        createTx(session, {
            category: "external",
            to: "0xabc",
            from: "0x323",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() =>
        createTx(session, {
            category: "internal",
            to: "0x123",
            from: "0x204",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
            toIsUser: true,
            fromIsUser: true,
        })
    )
    .then(() => session.close())
    .then(() => console.log("finished"));

module.exports = {
    session,
    createTx,
    driver
}
