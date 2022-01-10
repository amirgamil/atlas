import { opcodes } from "./codemap";

function hexToIntArray(hexString: string): number[] {
    if (hexString.slice(0, 2) === '0x') {
        hexString = hexString.slice(2)
    }
    const integers = [];
    for (let i = 0; i < hexString.length; i += 2) {
        integers.push(parseInt(hexString.slice(i, i + 2), 16))
    }
    return integers
}

function intArrayToHex(ints: number[]): string {
    const hex = ints.map(n => n ? ((n <= 0xf ? '0' : '') + n.toString(16)) : '00')
    return `0x${hex.join('')}`
}

export function parseCode(raw: string) {
    const rawbytes = hexToIntArray(raw);
    const code = [];
    for (let i = 0; i < rawbytes.length; i++) {
        const opcode = opcodes(rawbytes[i], true);
        if (opcode.name.slice(0, 4) === 'PUSH') {
            const length = rawbytes[i] - 0x5f;
            const data = rawbytes.slice(i + 1, i + length + 1);

            // in case pushdata extends beyond code
            if (i + 1 + length > rawbytes.length) {
                for (let j = opcode.pushData.length; j < length; j++) {
                    data.push(0)
                }
            }

            opcode.pushData = intArrayToHex(data);
            i += length
        }
        code.push(opcode)
    }
    return code
}

