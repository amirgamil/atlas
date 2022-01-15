import { useState, useEffect, useRef } from "react";
import Neovis, { NEOVIS_ADVANCED_CONFIG, NeoVisEvents } from "neovis.js";
import { utils } from "ethers";
import Loader from "./Loader";
import axios from "axios";
import useDebounce from "../hooks/useDebounce";

const NEO4JURI = "neo4j://143.244.183.189";
const NEO4JUSER = "neo4j";
const NEO4JPASS = "miller-regular-game-printer-meter-6970";

const secondOrderQuery = (addr: string) => {
  return `MATCH (acc:User {addr: '${addr}'})-[edge:To]->(child)-[edge2:To]->(second)
  RETURN acc, edge, child, edge2, second`; //edge2, second;
};

// 0xa335ade338308b8e071cf2c8f3ca5e50f6563c60 is a good user for testing

export const getContractNameScrape = async (addr: string) => {
  // Can only run 5/sec
  if (!utils.isAddress(addr)) return;
  const res = await fetch(`https://etherscan.io/address/${addr}`);
  const data = await res.json();
  const start = data.indexOf("<title>") + 6 + 4;
  const end = data.indexOf("| 0x") ?? data.indexOf("</title>");
  console.log(start, end);
  const title = data.substring(start, end).trim();
  return title;
};

// Old (v1) config
/*
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
          caption: (node: any) => node.properties.addr.slice(0, 6),
        },
      },
      relationships: {
        To: {
          thickness: "count",
          caption: false,
        },
      },
    };
*/

const graph = ({ user }: { user: string }) => {
  // TODO: don't use any
  const visRef: any = useRef();

  const [loading, setLoading] = useState(true);
  const [addrs, setAddrs] = useState<Array<any>>([]);
  const [names, setNames] = useState<any>({});
  const debouncedAddrs = useDebounce(addrs, 5000);

  const getNamesForAddrs = async () => {
    const names = await axios.post("http://localhost:3001/names", {
      addresses: addrs,
    });
    return names.data.result;
  };

  useEffect(() => {
    const f = async () => {
      const nameResponse = await getNamesForAddrs();
      console.log("nr", nameResponse);
      setNames(nameResponse);
    };

    f();
  }, [debouncedAddrs]);

  useEffect(() => {
    console.log("names", names);

    const config = {
      containerId: visRef.current.id,
      neo4j: {
        serverUrl: NEO4JURI,
        serverUser: NEO4JUSER,
        serverPassword: NEO4JPASS,
      },
      initialCypher: secondOrderQuery(user),
      labels: {
        User: {
          [NEOVIS_ADVANCED_CONFIG]: {
            function: {
              color: (node: any) =>
                node.properties.addr === user ? "yellow" : "#0087b6",
              title: (node: any) => node.properties.addr,
            },
          },
        },
        Contract: {
          [NEOVIS_ADVANCED_CONFIG]: {
            function: {
              color: (node: any) => "#00d47f",
              title: async (node: any) => {
                if (Object.keys(names).length === 0)
                  setAddrs((names) => [...names, node.properties.addr]);
                const n = names[node.properties.addr] ?? node.properties.addr;
                return n;
              },
            },
          },
        },
      },
      relationships: {
        To: {
          value: "count",
          [NEOVIS_ADVANCED_CONFIG]: {
            function: {
              color: (_: any) => "grey",
            },
          },
        },
      },
    };
    // Neovis provided types are wrong >:(
    // @ts-ignore
    const vis = new Neovis(config);
    vis.render();
    vis.registerOnEvent(NeoVisEvents.CompletionEvent, () => {
      if (Object.keys(names).length !== 0) {
        setLoading(false);
      }
      vis.network!.on("click", (nodes) => {
        try {
          const addr = vis.nodes._data.get(nodes.nodes[0]).raw.properties.addr;
          window.open(`https://etherscan.io/address/${addr}`, "_blank");
        } catch {
          console.log(nodes);
        }
      });
    });
    //vis.stabilize();
  }, [user, names]);

  return (
    <>
      {loading && <Loader loading />}
      <div
        id={"graphcontainer"}
        ref={visRef}
        style={{
          width: `1200px`,
          height: `800px`,
          visibility: loading ? "hidden" : "visible",
        }}
      />
    </>
  );
};

export default graph;
