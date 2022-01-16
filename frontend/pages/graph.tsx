import dynamic from "next/dynamic";
import React from "react";
import { useAppContext } from "../components/Context";
import SafeHydrate from "../components/SafeHydrate";
import { useRouter } from 'next/router'
const Graph = dynamic(() => import("../components/GraphView"), { ssr: false });

import styles from "../styles/Home.module.css";

import Nav from "../components/Nav";
import Head from "next/head";

const UserGraph = () => {
  return (
    <div className={styles.container}>
      <Nav />
      <Head>
        <title>Atlas | The Graph</title>
        <meta name="description" content="The Web3 Recommendation Engine" />
        <link rel="icon" href="/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className={`overflow-y-auto ${styles.main}`}>
        <div className="flex">
          <div className="mx-auto mt-20 w-1/2 h-full">
            <h1 className="text-gradient text-4xl glow">The Graph</h1>
            <SafeHydrate>
              <Graph />
            </SafeHydrate>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserGraph;
