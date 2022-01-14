import useData from "../hooks/useData";
import UhOh from "./UhOh";
import Loader from "./Loader";
import Token, {IToken} from "./WalletTokenDisplay";
import {useAppContext} from "./Context";
import {Recommendation} from "./RecommendationDisplay";
import * as React from "react";
import {useMemo} from "react";

function TokenList({address}: {address: string}) {
  const { data, error } = useData(`/tokens?address=${address}`)

  if (error) return <UhOh>Failed to load tokens</UhOh>
  if (!data) return <Loader loading />
  return <div>
    {data.map((tok: IToken) => <Token {...tok} />)}
  </div>
}

function MyWallet({address}: {address: string}) {
  const context = useAppContext();

  return (<div className="text-white w-1/2 m-auto">
    <div className="my-24">
      <h1 className="text-gradient text-4xl">My Wallet</h1>
      <p>All of your ERC-20, ERC-721, and ERC-1155 tokens. Click on each token to see what you can do with it.</p>
      <TokenList address={address}/>
    </div>
    <div className="my-24">
      <h1 className="text-gradient text-4xl">For you</h1>
      <p>A hand-picked selection of recommendations you might find fun.</p>
      {context.isLoadingRecommendations && <Loader loading/>}
      {context.recommendations
        .filter((item, pos, self) => self.indexOf(item) == pos)
        .slice(0, 6)
        .map((el, i) => (
          <Recommendation key={i} {...el} />
        ))
      }
    </div>
  </div>)
}

export default MyWallet
