import axios from "axios";

export const getTokens = async (addr: string) => {
  const res = await axios.get(`http://api.ethplorer.io/getAddressInfo/${addr}?apiKey=${process.env.ETHPLORER_API_KEY}`)
  return res.data.tokens
}


export const getNFTs = async (addr: string) => {
  const res = await axios.get(`https://api.opensea.io/api/v1/assets?owner=${addr}`)
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
      logo: asset.image_thumbnail_url
    }
  }))
}
