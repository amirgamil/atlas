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
    from: String;
    blockNum: String;
    value: Number;
    asset: String;
    hash: String;
    distance: Number;
}

async function createConstraints(session: typeof neo4j.Session) {
    const template = `
    CREATE CONSTRAINT ON (n:Account) ASSERT (n.addr) IS UNIQUE
    `;
    return session.run(template);
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
    let isUserA = false;
    let isUserB = false;
    if (data.category === "external") {
        isUserA = true;
        isUserB = true;
    } else if (data.category === "internal") {
        isUserA = false;
        isUserB = false;
    } else {
        isUserA = true;
        isUserB = false;
    }
    const template = `
    MERGE (a:Account {addr: $from, isUser: ${isUserA}})
    MERGE (b:Account {addr: $to, isUser: ${isUserB}})
    CREATE p = (a)-[:To { category: $category, isUserA: ${isUserA}, isUserB: ${isUserB}, blockNum: $blockNum, value: $value, asset: $asset, hash: $hash, distance: $distance}]->(b)
    RETURN p
    `;
    return session.run(template, data);
}

const session = driver.session();
nuke(session)
    // .then(() => createConstraints(session))
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
        })
    )
    .then(() =>
        createTx(session, {
            category: "external",
            from: "0xabc",
            to: "0x123",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
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
        })
    )
    .then(() =>
        createTx(session, {
            category: "data",
            to: "0x204",
            from: "0x223",
            blockNum: "0x191",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
        })
    )
    .then(() =>
        createTx(session, {
            category: "data",
            to: "0xabc",
            from: "0x223",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
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
        })
    )
    .then(() => session.close())
    .then(() => console.log("finished"));

module.exports = {
    session,
    createTx,
    driver
}