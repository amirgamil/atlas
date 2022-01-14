import dynamic from "next/dynamic";
import React from "react";
import { useAppContext } from "../components/Context";
import SafeHydrate from "../components/SafeHydrate";
const Graph = dynamic(() => import("../components/GraphView"), { ssr: false });

const UserGraph = () => {
  const context = useAppContext();
  console.log("address: ", context.address);
  return (
    <SafeHydrate>
      <Graph user={"0xa335ade338308b8e071cf2c8f3ca5e50f6563c60"} />
    </SafeHydrate>
  );
};

export default UserGraph;
