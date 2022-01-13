import useData from "../hooks/useData";
import UhOh from "./UhOh";
import Loader from "./Loader";
import Token, {IToken} from "./TokenDisplay";

function TokenList({address}: {address: string}) {
  const { data, error } = useData(`/tokens?address=${address}`)
  console.log(data, error)

  if (error) return <UhOh>Failed to load tokens</UhOh>
  if (!data) return <Loader loading />
  return <div>
    {data.map((tok: IToken) => <Token {...tok} />)}
  </div>
}

function MyWallet({address}: {address: string}) {
  return (<div className="text-white w-1/2 m-auto my-24">
    <h1 className="text-gradient text-4xl">My Wallet</h1>
    <p>All of your ERC-20, ERC-721, and ERC-1155 tokens. Click on each token to see what you can do with it.</p>
    <TokenList address={address}/>
  </div>)
}

export default MyWallet
