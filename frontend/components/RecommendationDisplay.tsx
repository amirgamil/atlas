import Avatar from "boring-avatars";
import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { fetcher } from "../hooks/useData";
import Loader from "./Loader";

export interface Account {
  address?: string;
  name?: string;
  addr?: string;
}

interface Props {
  account: Account;
  setFeedback: (feedback: Account, isGoodRecommendation: boolean) => void;
}

const StyledButton = styled.button<{ isSelected: boolean }>`
  font-weight: 700;
  padding: 0.5em 1.2em;
  border-radius: 12px;
  background-size: 100% 8vw;
  ${(p) =>
    p.isSelected
      ? `background-image: linear-gradient(
      to right top,
      #3f5d88,
      #0087b6,
      #00b1b5,
      #00d47f,
      #a8eb12
    );`
      : "background: transparent"};

  &:hover {
    transition: background 1s ease;
    background-image: linear-gradient(
      to right top,
      #3f5d88,
      #0087b6,
      #00b1b5,
      #00d47f,
      #a8eb12
    );
  }
`;

const hardcodedNames: Record<string, string> = {
  "0xd569d3cce55b71a8a3f3c418c329a66e5f714431": "Juicebox: Terminal V1",
  "0xefe0fed2b728b9711030e7643e98477957df9809": "Orion",
};

const hardcoded = (addr: string) => {
  return hardcodedNames[addr] ?? addr;
};

export const Recommendation: React.VFC<Props> = ({ props, setFeedback }) => {
  const [isGood, setIsGood] = React.useState<boolean | undefined>(undefined);

  console.log(props);

  return (
    <div className="glass my-6 py-2 px-4 w-full flex">
      <div className="my-auto mr-4">
        <Avatar
          size={30}
          variant="marble"
          name={account.name}
          colors={["#3f5d88", "#0087b6", "#00b1b5", "#00d47f", "#a8eb12"]}
        />
      </div>
      <div className="flex items-center w-full mr-3">
        <h3 className="text-lg">
          <span className="opacity-50 text-base font-normal"></span>
        </h3>
        <a
          className="opacity-50 text-sm"
          href={`https://etherscan.io/address/${account.addr}`}
        >
          {props.addr !== props.name ? props.name : hardcoded(props.addr!)}
        </a>
        <div className="ml-auto">
          <StyledButton
            isSelected={isGood === true}
            className="m-1"
            onClick={() => {
              setIsGood(true);
              setFeedback(account, true);
            }}
          >
            👍
          </StyledButton>
          <StyledButton
            isSelected={isGood === false}
            className="m-1"
            onClick={() => {
              setIsGood(false);
              setFeedback(account, false);
            }}
          >
            👎
          </StyledButton>
        </div>
      </div>
    </div>
  );
};

const fetchRelatedFn = async (addr: string) => {
  return await fetcher(`/similar-neighbors?address=${addr}`);
};

export const ExpandableRecommendation = ({ addr: address, name }: Account) => {
  const [children, setChildren] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    const recs = await fetchRelatedFn(address!);
    setChildren(recs);
    setLoading(false);
  }, [address]);

  return (
    <div>
      <div className="glass my-6 py-2 px-4 w-3/5 flex" onClick={fetchChildren}>
        <div className="my-auto mr-4">
          <Avatar
            size={30}
            variant="marble"
            name={name}
            colors={["#3f5d88", "#0087b6", "#00b1b5", "#00d47f", "#a8eb12"]}
          />
        </div>
        <div style={{ wordWrap: "break-word" }} className="mr-3">
          <h3 className="text-lg">
            <span className="opacity-70 text-base font-normal">{name}</span>
          </h3>
          <a
            className="opacity-30 text-sm underline"
            href={`https://etherscan.io/address/${address}`}
          >
            View on Etherscan
          </a>
        </div>
      </div>
      <div className="ml-8">
        {loading && <Loader loading={loading} small />}
        {children.map((tok) => (
          <ExpandableRecommendation {...tok} />
        ))}
      </div>
    </div>
  );
};
