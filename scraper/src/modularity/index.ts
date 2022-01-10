const nodefetch = require("node-fetch")
const { parseByteCode } = require("./disassemble_bytecode")
require("dotenv").config({
    path: "./scraper/.env",
})

async function getByteCode(address: string) {
    const body = {
        jsonrpc: "2.0",
        method: "eth_getCode",
        id: 0,
        params: [address],
    }
    const res = await nodefetch(
        `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        {
            method: "POST",
            body: JSON.stringify(body),
        }
    );
    const json = await res.json();
    return parseByteCode(json.result)
}

module.exports = getByteCode
