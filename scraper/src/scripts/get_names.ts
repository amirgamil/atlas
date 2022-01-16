import { executeReadQuery } from "../neo4jWrapper";
import dotenv from "dotenv";
import { getContractName, delay } from "../util";
import fs from "fs";
dotenv.config({
  path: "./src/.env",
});

const main = async () => {
  const res = await executeReadQuery("MATCH (n:Contract) RETURN n.addr");
  const addresses = res.records.map((r) => r.get("n.addr"));

  const names: Record<string, string> = {};

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    const name = await getContractName(addr);
    if (name && name.length > 1) {
      names[addr] = name;
    }
    if (i % 10 == 0) console.log(i);
    if (i % 500 == 0) {
      fs.writeFile(
        __dirname + "/contractnames.json",
        JSON.stringify(names),
        (err: any) => {
          if (err) console.log(err);
        }
      );
    }
  }
};

main();
