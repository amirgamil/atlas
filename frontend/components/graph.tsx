import { useState, useEffect, useRef } from "react";
import Neovis from "neovis.js";

const NEO4JURI = "neo4j://143.244.183.189";
const NEO4JUSER = "neo4j";
const NEO4JPASS = "miller-regular-game-printer-meter-6970";

const secondOrderQuery = (addr: string) => {
  return `MATCH (acc:User {addr: '${addr}'})-[edge:To]->(child)-[edge2:To]->(second)
  RETURN acc, edge, child, edge2, second`;
};

const graph = ({}) => {
  // TODO: don't use any
  const visRef: any = useRef();

  useEffect(() => {
    const config = {
      container_id: visRef.current.id,
      server_url: NEO4JURI,
      server_user: NEO4JUSER,
      server_password: NEO4JPASS,
      initial_cypher: secondOrderQuery(
        "0x0fe35cb5c7d2dfd63eb4eb9e02a6f20117a3303b"
      ),
      labels: {
        Contract: {
          caption: "addr",
        },
      },
      relationships: {
        To: {
          thickness: "count",
          caption: false,
        },
      },
    };
    const vis = new Neovis(config);
    vis.render();
  }, []);

  return (
    <div
      id={"graphcontainer"}
      ref={visRef}
      style={{
        width: `600px`,
        height: `400px`,
        backgroundColor: `white`,
      }}
    />
  );
};

export default graph;
