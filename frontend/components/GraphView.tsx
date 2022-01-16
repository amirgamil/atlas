import React, {useMemo} from "react";
import Loader from "./Loader";
import {useAppContext} from "./Context";
import {useRouter} from "next/router";
import useData from "../hooks/useData";
import UhOh from "./UhOh";

import ForceGraph2D, {NodeObject} from 'react-force-graph-2d';

const VisNetwork = (props: {center: string, nodes: any[], links: any[]}) => {
  return <ForceGraph2D
    graphData={props}
    enableNodeDrag={true}
    enableZoomInteraction={false}
    minZoom={1.5}
    nodeVal={n => Math.log(props.links.filter(l => l.to === n.id).length + 1)}
    nodeColor={(n: any) => n.id === props.center.toLowerCase() ? "#a8eb12" : (n.type === "User" ? "#00b1b5" : "#0087b6")}
    nodeLabel={(n: any) => n.label}
    linkLabel={(l: any) => `${(l.value || 0).toFixed(0.2)} ${l.asset}`}
    linkColor={() => "#3f5d88"}
    // @ts-ignore
    onNodeClick={n => window.location = `/graph?address=${n.id}`}
  />
}

const graph = () => {
  const context = useAppContext();
  const router = useRouter()
  const user = useMemo(() => (router.query.center?.[0] || context.address || ""), [])
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
    <VisNetwork nodes={nodes} links={edges} center={user} />
  );
};

export default graph;
