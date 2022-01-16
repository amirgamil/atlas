import Image from "next/image";
import Avatar from "boring-avatars";
import { useCallback, useState } from "react";
import Loader from "./Loader";
import { fetcher } from "../hooks/useData";
import { ExpandableRecommendation } from "./RecommendationDisplay";
import { Account } from "../types";

export interface IToken {
  balance: number;
  contractAddress: string;
  metadata: {
    decimals: number;
    logo: string;
  };
  name: string;
  symbol: string;
  type: string;
}

const fetchRelatedFn = async (addr: string) => {
  return await fetcher(`/similar-neighbors?address=${addr}`);
};

function Token(props: IToken) {
  const [children, setChildren] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    const recs = await fetchRelatedFn(props.contractAddress);
    setChildren(recs);
    setLoading(false);
  }, [props.contractAddress]);

  const isNFT = props.type !== "ERC20";

  return (
    <div>
      <button
        className="glass my-6 py-2 px-4 w-1/2 flex text-left"
        onClick={fetchChildren}
      >
        <div className="my-auto mr-4">
          {props.metadata.logo ? (
            <img
              className={isNFT ? "rounded-md" : "rounded-full"}
              src={props.metadata.logo}
              width={40}
              height={40}
            />
          ) : (
            <Avatar
              size={40}
              variant="marble"
              name={props.name || props.symbol || props.contractAddress}
              colors={["#3f5d88", "#0087b6", "#00b1b5", "#00d47f", "#a8eb12"]}
            />
          )}
        </div>
        {isNFT ? (
          <div>
            <h3 className="text-lg">
              {props.name} - {props.symbol}{" "}
              <span className="opacity-50 text-base font-normal">
                ({props.type})
              </span>
            </h3>
            <a
              className="opacity-30 text-sm font-normal underline underline-offset-2"
              href={`https://etherscan.io/address/${props.contractAddress}`}
            >
              View on Etherscan
            </a>
          </div>
        ) : (
          <div>
            <h3 className="text-lg">
              {props.balance ? props.balance.toFixed(2) : 0} {props.symbol}{" "}
              <span className="opacity-50 text-base font-normal">
                ({props.type})
              </span>
            </h3>
            <a
              className="opacity-30 text-sm font-normal underline underline-offset-2"
              href={`https://etherscan.io/address/${props.contractAddress}`}
            >
              View on Etherscan
            </a>
          </div>
        )}
      </button>
      <div className="ml-8">
        {loading && <Loader loading={loading} small />}
        {children.map((tok) => (
          <ExpandableRecommendation {...tok} />
        ))}
      </div>
    </div>
  );
}

export default Token;
