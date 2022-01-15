import dynamic from "next/dynamic";
import React from "react";
import { useAppContext } from "../components/Context";
import SafeHydrate from "../components/SafeHydrate";
const Graph = dynamic(() => import("../components/GraphView"), { ssr: false });

import styles from "../styles/Home.module.css";

import Nav from "../components/Nav";
import Head from "next/head";

const UserGraph = () => {
  const context = useAppContext();
  console.log("address: ", context.address);
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
        <div className="flex">
          <div className="rounded-md mx-auto mt-4">
            <SafeHydrate>
              <Graph user={"0xa335ade338308b8e071cf2c8f3ca5e50f6563c60"} />
            </SafeHydrate>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserGraph;
