import Image from 'next/image'
import Avatar from "boring-avatars";

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

function Token(props: IToken) {
  return (<div className="glass my-6 py-2 px-4 w-1/2 flex">
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
      <h3 className="text-lg">{props.balance.toFixed(2)} {props.symbol} <span className="opacity-50 text-base font-normal">({props.type})</span></h3>
      <a className="opacity-50 text-sm" href={`https://etherscan.io/address/${props.contractAddress}`}>{props.contractAddress}</a>
    </div>
  </div>)
}

export default Token
