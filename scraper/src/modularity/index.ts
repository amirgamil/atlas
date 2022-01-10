import axios from "axios";
import { parseCode } from "./disassemble_bytecode";
import dotenv from "dotenv";
dotenv.config({
    path: "./scraper/.env",
});

export async function getByteCode(address: string) {
    const body = {
        jsonrpc: "2.0",
        method: "eth_getCode",
        id: 0,
        params: [address],
    };
    const res = await axios.post(
        `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        body
    );
    const json = res.data as any;
    return parseCode(json.result);
}
