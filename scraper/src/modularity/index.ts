import axios from "axios";
import { parseCode } from "./disassemble_bytecode";
import dotenv from "dotenv";
import {OpCode} from "./codemap";
dotenv.config({
    path: "./src/.env",
});

export async function getByteCode(address: string): Promise<OpCode[]> {
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

function getSigHashes(bytecode: OpCode[]): string[] {
    // pushdata contains first 4 bytes of the Keccak hash of the ASCII form of the function signature
    return bytecode.filter(c => c.pushData !== "").map(c => c.pushData)
}

type Counts = { [key: string]: number }
export function jaccardIndex(codes1: string[], codes2: string[]) {
    const getCounts = (codes: string[]) => {
        const res: Counts = {}
        return codes.reduce((total, cur) => {
            if (total.hasOwnProperty(cur)) {
                total[cur] += 1
            } else {
                total[cur] = 1
            }
            return total
        }, res)
    }
    const s1 = getCounts(codes1)
    const s2 = getCounts(codes2)
    const intersection = (c1: Counts, c2: Counts) => {
        const intersectedKeys = Object.keys(c1).filter(k => c2.hasOwnProperty(k))
        return intersectedKeys
            .map(k => Math.min(c1[k], c2[k]))
            .reduce((a,b) => a + b, 0)
    }
    const union = (c1: Counts, c2: Counts) => {
        const unionedKeys = new Set<string>()
        Object.keys(c1).forEach(k => unionedKeys.add(k))
        Object.keys(c2).forEach(k => unionedKeys.add(k))
        return [...unionedKeys]
            .map(k => Math.max(c1[k] || 0, c2[k] || 0))
            .reduce((a,b) => a + b, 0)
    }
    return intersection(s1, s2)/union(s1, s2)
}

export function flatJaccardIndex(codes1: string[], codes2: string[]) {
    return jaccardIndex([...new Set(codes1)], [...new Set(codes2)])
}

function permute2<T>(array: T[]): T[][] {
    return array.flatMap(
        (v, i) => array.slice(i+1).map(w => [v, w])
    )
}

function wrap(name: string, opcodes: OpCode[]) {
    return ({
        name,
        opcodes,
    })
}

export async function batchCompare(main: string, contracts: Array<string>) {
    // Returns list of addresses, sorted desc by Jaccard similarity
    const mainBytecode = await getByteCode(main);
    const byteCodes = await Promise.all(contracts.map(a => getByteCode(a)));

    const out = byteCodes.map((c, i) => ({
        address: contracts[i],
        score: jaccardIndex(getSigHashes(mainBytecode), getSigHashes(c))
    }));

    out.sort((a, b) => b.score - a.score);
    return out
}

async function main() {
    const cryptokitties = await getByteCode("0x06012c8cf97bead5deae237070f9587f8e7a266d")
    const bridge1 = await getByteCode("0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f")
    const bridge2 = await getByteCode("0x7a250d5630b4cf539739df2c5dacb4c659f2488d")
    const cryptopuppies = await getByteCode("0xb64e6bef349a0d3e8571ac80b5ec522b417faeb6")
    // console.log(jaccardIndex(getSigHashes(cryptokitties), getSigHashes(cryptopunks)))
    // console.log(jaccardIndex(getSigHashes(cryptokitties), getSigHashes(cryptopunks)))
    const permutations = permute2([
        wrap('cryptokitties', cryptokitties),
        wrap('bridge1', bridge1),
        wrap('bridge2', bridge2),
        wrap('cryptopuppies', cryptopuppies)
    ])
    permutations.forEach(([a, b]) => {
        const sigHashes = [getSigHashes(a.opcodes), getSigHashes(b.opcodes)]
        console.log(`[${jaccardIndex(getSigHashes(a.opcodes), getSigHashes(b.opcodes))}] ${a.name}<->${b.name}`)
    })
}

// main()
