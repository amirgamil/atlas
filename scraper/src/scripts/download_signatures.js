const nodefetch = require("node-fetch");
const fs = require("fs");

async function getSignaturePage(n) {
  try {
    const res = await nodefetch(
      `https://www.4byte.directory/api/v1/signatures/?page=${n}`
    );
    const json = await res.json();
    const results = json.results;
    return results;
  } catch {
    console.log("err", n);
  }
}

function saveSignatures(obj) {
  fs.writeFile(
    __dirname + "/../signatures.json",
    JSON.stringify(obj),
    (err) => {
      if (err) console.log(err);
    }
  );
}

async function main() {
  signatures = {};
  promises = [];
  for (let i = 1; i < 4225; i++) {
    const page = await getSignaturePage(i);
    page.forEach((obj) => (signatures[obj.hex_signature] = obj));
    if (i % 25 === 0) console.log(i);
  }
  saveSignatures(signatures);
}

main();
