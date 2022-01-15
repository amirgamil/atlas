import type { NextPage } from "next";
import styles from "../styles/Home.module.css";
import Nav from "../components/Nav";
import Head from "next/head";
import {Recommendation} from "../components/RecommendationDisplay";
import * as React from "react";
import useData from "../hooks/useData";
import UhOh from "../components/UhOh";
import Loader from "../components/Loader";

interface Account {
  addr: string;
  name?: string;
}

const Explore: NextPage = () => {
  const { data, error } = useData('/hot')

  if (error) return <UhOh>Failed to hot contracts</UhOh>
  if (!data) return <Loader loading />

  return (
    <div className={styles.container}>
      <Nav />
      <Head>
        <title>Atlas | Hot Contracts</title>
        <meta name="description" content="The Web3 Recommendation Engine" />
        <link rel="icon" href="/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className={`overflow-y-auto ${styles.main}`}>
        <div className="my-24 text-white w-1/2 m-auto">
          <h1 className="text-gradient text-4xl glow">Hot Contracts</h1>
          {
            (data.results || []).slice(0, 6).map((el: any) => (
              <Recommendation props={el} setFeedback={() => {}} />
            ))
          }
        </div>
      </main>
    </div>
  );
}

export default Explore
