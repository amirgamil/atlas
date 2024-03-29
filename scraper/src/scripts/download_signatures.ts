import nodefetch from "node-fetch";
import fs from "fs";

async function getSignaturePage(n: any) {
    try {
        const res = await nodefetch(
            `https://www.4byte.directory/api/v1/signatures/?page=${n}`
        );
        const json = (await res.json()) as any;
        const results = json.results;
        return results;
    } catch {
        console.log("err", n);
    }
}

function saveSignatures(obj: any) {
    fs.writeFile(
        __dirname + "/../signatures.json",
        JSON.stringify(obj),
        (err) => {
            if (err) console.log(err);
        }
    );
}

async function main() {
    const signatures: Record<string, unknown> = {};
    const promises = [];
    for (let i = 1; i < 4225; i++) {
        const page = await getSignaturePage(i);
        page.forEach((obj: any) => (signatures[obj.hex_signature] = obj));
        if (i % 25 === 0) console.log(i);
    }
    saveSignatures(signatures);
}

main();
