import * as React from "react";
import { useAppContext } from "../components/Context";
import { Recommendation } from "../components/RecommendationDisplay";

const Recommend = () => {
  const context = useAppContext();

  if (context.isLoadingRecommendations)
    return <p>We are unveiling your deepest, darkest secrets</p>;
  else if (!context.recommendations) {
    context.loadRecommendations();
    return <p>We are unveiling your deepest, darkest secrets</p>;
  }

  //FIXME: remove this
  return (
    <div
      style={{ background: "black" }}
      className="text-white w-1/2 m-auto my-24"
    >
      <h1 className="text-gradient text-4xl">For you</h1>
      <p className="">🔥 Recommendations</p>
      {context.recommendations.map((el, i) => (
        <Recommendation key={i} {...el} />
      ))}
    </div>
  );
};

export default Recommend;
