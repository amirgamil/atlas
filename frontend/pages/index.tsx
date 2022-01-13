import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";

import Nav from "../components/Nav";
import SafeHydrate from "../components/SafeHydrate";
import { useAppContext } from "../components/Context";
import { useEffect, useState } from "react";
import constants from "../constants";
import axios from "axios";
import Splash from "../components/Splash";
import MyWallet from "../components/MyWallet";

const Graph = dynamic(() => import("../components/Graph"), { ssr: false });

interface Account {
  addr: string;
  name?: string;
}

interface Response {
  results: Account[];
}

const Home: NextPage = () => {
  const context = useAppContext();
  const [address, setAddress] = useState<string>("");
  const [recommended, setRecommended] = useState<Array<Account>>([]);
  const [hot, setHot] = useState<Array<Account>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Get hot contracts
    const f = async () => {
      try {
        const res = await axios.get<Response>(`${constants.serverUri}/hot`);
        const results = res.data.results;
        setHot(results);
      } catch (err: any) {
        console.log(err);
      }
    };

    setAddress(context.address ?? "");
    f();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recommendations = await axios.get<Response>(
        "http://localhost:3001/recommend",
        {
          params: {
            address: address,
          },
        }
      );
      console.log("recommended: ", recommendations.data.results);
      setRecommended(recommendations.data.results);
    } catch (err: any) {
      alert(err);
    }
    setLoading(false);
  };


  return (
    <div className={styles.container}>
      <Nav />
      <Head>
        <title>Atlas | Discover Web3</title>
        <meta name="description" content="The Web3 Recommendation Engine" />
        <link rel="icon" href="/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className={`overflow-y-auto ${styles.main}`}>
        {context.address ?
          <MyWallet address={context.address}/> :
          <Splash/>
        }
        {/*<div>*/}
        {/*  <h1 className="text-center py-4">Transaction Graph</h1>*/}
        {/*  <div className="mt-1">*/}
        {/*    <div className="mb-2">*/}
        {/*      <input*/}
        {/*        type="text"*/}
        {/*        name="name"*/}
        {/*        id="name"*/}
        {/*        className="h-16 ring-offset-2 outline-none ring-2 block w-full sm:text-sm p-4"*/}
        {/*        placeholder="Your Address"*/}
        {/*        value={address}*/}
        {/*        onChange={(e) => setAddress(e.target.value)}*/}
        {/*      />*/}
        {/*    </div>*/}
        {/*    <div className="w-full flex flex-col justify-center items-center mt-10">*/}
        {/*      <button*/}
        {/*        style={{*/}
        {/*          background: "#4287f5",*/}
        {/*          color: "white",*/}
        {/*        }}*/}
        {/*        className="rounded-md px-4 py-3 text-md"*/}
        {/*        onClick={loadRecommendations}*/}
        {/*      >*/}
        {/*        Get recommendation*/}
        {/*      </button>*/}
        {/*      {loading ? <p>Learning your deepest darkest secrets</p> : null}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*  <div className="text-center mt-6">*/}
        {/*    {!loading && recommended.length > 0 ? (*/}
        {/*      <div>*/}
        {/*        <h1 className="text-center">Your Recommendations</h1>*/}
        {/*        {recommended.map((a) => (*/}
        {/*          <div>*/}
        {/*            <a href={`https://etherscan.io/address/${a.addr}`}>*/}
        {/*              {a.name ? a.name : a.addr}*/}
        {/*            </a>*/}
        {/*          </div>*/}
        {/*        ))}*/}
        {/*      </div>*/}
        {/*    ) : null}*/}
        {/*  </div>*/}
        {/*  {address ? (*/}
        {/*    <SafeHydrate>*/}
        {/*      <Graph user={address} />*/}
        {/*    </SafeHydrate>*/}
        {/*  ) : null}*/}
        {/*  <div className="text-center mt-6">*/}
        {/*    {hot.length > 0 ? (*/}
        {/*      <div>*/}
        {/*        <h1 className="text-center">Hot Contracts</h1>*/}
        {/*        {hot.map((a, i) => (*/}
        {/*          <div key={i}>*/}
        {/*            <a href={`https://etherscan.io/address/${a.addr}`}>*/}
        {/*              {a.name ? a.name : a.addr}*/}
        {/*            </a>*/}
        {/*          </div>*/}
        {/*        ))}*/}
        {/*      </div>*/}
        {/*    ) : null}*/}
        {/*  </div>*/}
        {/*</div>*/}
      </main>
    </div>
  );
};

export default Home;
