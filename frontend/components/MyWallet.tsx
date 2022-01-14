import useData from "../hooks/useData";
import UhOh from "./UhOh";
import Loader from "./Loader";
import Token, { IToken } from "./WalletTokenDisplay";
import { useAppContext } from "./Context";
import { Recommendation } from "./RecommendationDisplay";
import * as React from "react";
<<<<<<< HEAD
import { Account, FeedbackDetails } from "../types";
=======
>>>>>>> f32ed1e7aba622161decdeb0af3f1c13c3bf9ad3

function TokenList({ address }: { address: string }) {
  const { data, error } = useData(`/tokens?address=${address}`);

  if (error) return <UhOh>Failed to load tokens</UhOh>;
  if (!data) return <Loader loading />;
  return (
    <div>
      {data.map((tok: IToken) => (
        <Token {...tok} />
      ))}
    </div>
  );
}

interface Props {
  address: string;
}

export const MyWallet: React.FC<Props> = ({ address }) => {
  const [feedback, setFeedback] = React.useState<
    Record<string, FeedbackDetails>
  >({});
  const context = useAppContext();

<<<<<<< HEAD
  const setAccountFeedback = (acc: Account, isGoodRecommendation: boolean) => {
    const feedbackCopy = { ...feedback };
    feedbackCopy[acc.addr] = { name: acc.name, isGoodRecommendation };
    setFeedback(feedbackCopy);
  };

  console.log(context.recommendations);
  return (
    <div className="text-white w-1/2 m-auto">
      <div className="my-24">
        <h1 className="text-gradient text-4xl">My Wallet</h1>
        <p>
          All of your ERC-20, ERC-721, and ERC-1155 tokens. Click on each token
          to see what you can do with it.
        </p>
        <TokenList address={address} />
      </div>
      <div className="my-24">
        <h1 className="text-gradient text-4xl">For you</h1>
        <p>A hand-picked selection of recommendations you might find fun.</p>
        {context.isLoadingRecommendations && <Loader loading />}
        {context.recommendations &&
          context.recommendations
            .filter((item, pos, self) => self.indexOf(item) == pos)
            .slice(0, 6)
            .map((el, i) => (
              <Recommendation
                key={i}
                props={el}
                setFeedback={setAccountFeedback}
              />
            ))}
        <div className="flex w-full items-center justify-center">
          <button
            onClick={async () => {
              if (context.address) {
                await context.updateRecommendations(context.address, feedback);
              }
            }}
          >
            Get more recommendations!
          </button>
        </div>
      </div>
=======
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

>>>>>>> f32ed1e7aba622161decdeb0af3f1c13c3bf9ad3
    </div>
  );
};

export default MyWallet;
