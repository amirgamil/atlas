import Image from 'next/image'
import Avatar from "boring-avatars";
import {useCallback, useState} from "react";
import Loader from "./Loader";
import {fetcher} from "../hooks/useData";

export interface IToken {
  balance: number
  contractAddress: string,
  metadata: {
    decimals: number,
    logo: string,
  },
  name: string,
  symbol: string,
  type: string,
}

const fetchRelatedFn = async (addr: string): Promise<IToken[]> => {
  const json = await fetcher(`/similar-neighbors?address=${addr}`)
  console.log(json)
  return []
}

function Token(props: IToken) {
  const [children, setChildren] = useState<IToken[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    const recs = await fetchRelatedFn(props.contractAddress)
    setChildren(recs)
    setLoading(false)
  }, [props.contractAddress])

  return (<div>
    <button className="glass my-6 py-2 px-4 w-1/2 flex text-left" onClick={fetchChildren}>
      <div className="my-auto mr-4">
        {props.metadata.logo ?
          <Image src={props.metadata.logo} width={30} height={30}/> :
          <Avatar
            size={30}
            variant="marble"
            colors={["#3f5d88", "#0087b6", "#00b1b5", "#00d47f", "#a8eb12"]}
          />}
      </div>
      <div>
        <h3 className="text-lg">{props.type !== "ERC-20" ? props.balance : props.balance.toFixed(2)} {props.symbol} <span className="opacity-50 text-base font-normal">({props.type})</span></h3>
        <a className="opacity-30 text-sm font-normal" href={`https://etherscan.io/address/${props.contractAddress}`}>{props.contractAddress}</a>
      </div>
    </button>
    <div className="ml-8">
      {loading && <Loader loading={loading} small />}
      {children.map(tok => <Token {...tok} />)}
    </div>
  </div>)
}

export default Token
