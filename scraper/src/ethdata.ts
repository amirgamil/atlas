import axios from "axios";
import { ethers } from "ethers";

const UNISWAP_PARTIAL_ABI = [
  {
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

const ERC20_PARTIAL_ABI = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const getTokens = async (addr: string) => {
  const res = await axios.get(
    `http://api.ethplorer.io/getAddressInfo/${addr}?apiKey=${process.env.ETHPLORER_API_KEY}`
  );
  const erc20Only = res.data.tokens.filter(
    (token: any) => token.tokenInfo.decimals !== "0"
  );
  return erc20Only;
};

export const getNFTs = async (addr: string) => {
  const res = await axios.get(
    `https://api.opensea.io/api/v1/assets?owner=${addr}`
  );
  return res.data.assets.map((asset: any) => ({
    collection: {
      name: asset.collection.name,
      logo: asset.collection.image_url,
    },
    balance: 1,
    name: asset.name,
    symbol: asset.asset_contract.symbol,
    type: asset.asset_contract.schema_name,
    contractAddress: asset.asset_contract.address,
    metadata: {
      logo: asset.image_thumbnail_url,
    },
  }));
};

export const resolveERC20Symbol = async (addr: string) => {
  const provider = new ethers.providers.AlchemyProvider(
    1,
    process.env.ALCHEMY_API_KEY
  );

  const contract = new ethers.Contract(addr, ERC20_PARTIAL_ABI, provider);
  return await contract.symbol();
};

export const resolvePoolName = async (addr: string) => {
  const provider = new ethers.providers.AlchemyProvider(
    1,
    process.env.ALCHEMY_API_KEY
  );

  const contract = new ethers.Contract(addr, UNISWAP_PARTIAL_ABI, provider);

  let t0 = await contract.token0();
  let t1 = await contract.token1();

  const names = await Promise.all([
    resolveERC20Symbol(t0),
    resolveERC20Symbol(t1),
  ]);
  return `Pool: ${names[0]}-${names[1]}`;
};
