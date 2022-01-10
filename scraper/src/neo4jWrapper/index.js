require("dotenv").config({
    path: "./scraper/.env",
});
const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function createConstraints(session) {
    const template = `
    CREATE CONSTRAINT ON (n:Account) ASSERT (n.addr) IS UNIQUE
    `;
    return session.run(template);
}

async function nuke(session) {
    return session
        .run("MATCH (a)-[r]->() DELETE a, r")
        .then(() => session.run("MATCH (a) DELETE a"));
}

async function createTx(session, data) {
    const template = `
    MERGE (a:Account {addr: $from})
    MERGE (b:Account {addr: $to})
    CREATE p = (a)-[:To { category: $category, blockNum: $blockNum, value: $value, asset: $asset, hash: $hash, distance: $distance}]->(b)
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
            to: "0xabc",
            from: "0xdef",
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
            to: "0xabc",
            from: "0x123",
            blockNum: "0x001",
            value: 0.5,
            asset: "ETH",
            hash: "0xeee",
            distance: 1,
        })
    )
    .then(() => session.close())
    .then(() => console.log("finished"));
