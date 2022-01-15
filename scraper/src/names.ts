import { AccountResponse } from "./scraper/types";
import { utils } from "ethers";
import { readFile } from "fs/promises";
import { resolveERC20Name } from "./ethdata";

const getName = async (addr: string): Promise<string> => {
  try {
    const filename = utils.getAddress(addr) + ".json";
    const content = await readFile(__dirname + "/../contracts/" + filename);
    const obj = JSON.parse(content.toString());
    let name = obj.project[0].toUpperCase() + obj.project.substring(1);
    if (obj.name) {
      // Not all contracts are labeled w a name
      name += `: ${obj.name}`;
    }
    console.log(name);
    return name;
  } catch {
    try {
      const name = await resolveERC20Name(addr);
      console.log(name);
      return name;
    } catch {
      console.log(addr);
      return addr;
    }
  }
};

export const getAccountResponse = async (addr: string): Promise<AccountResponse> => {
  let name = await getName(addr);
  return {addr, name};
};

export default getName;
