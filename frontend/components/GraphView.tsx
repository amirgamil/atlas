import React, {useEffect, useRef, useMemo} from "react";
import Loader from "./Loader";
import {useAppContext} from "./Context";
import {useRouter} from "next/router";
import useData from "../hooks/useData";
import UhOh from "./UhOh";

import ForceGraph2D from 'react-force-graph-2d';

const VisNetwork = (props: {nodes: any[], links: any[]}) => {
  console.log(props.nodes)
  return <ForceGraph2D
    graphData={props}

  />
}

const graph = () => {
  const context = useAppContext();
  const router = useRouter()
  const user = useMemo(() => router.query.center || context.address, [])
  const { data, error } = useData(`/graph?address=${user}`)
  const nodes = data?.results.nodes || []
  const edges = (data?.results.edges || []).map((e: any) => ({
    ...e,
    source: e.from,
    target: e.to,
  }))

  if (error) return <UhOh>Failed to load graph</UhOh>
  if (!data) return <Loader loading />

  return (
    <VisNetwork nodes={nodes} links={edges} />
  );
};

export default graph;
