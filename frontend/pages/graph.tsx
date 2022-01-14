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
      <Graph user={context.address!} />
    </SafeHydrate>
  );
};

export default UserGraph;
