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
  const [loading, setLoading] = useState<boolean>(false);
  const [hot, setHot] = useState<Array<Account>>([]);

  useEffect(() => {
    // Get hot contracts
    const f = async () => {
      try {
        const res = await axios.get<Response>(`${constants.serverUri}/hot`);
        const results = res.data.results;
        console.log(results);
        setHot(results);
      } catch (err: any) {
        console.log(err);
      }
    };

    setAddress(context.address ?? "");
    f();
  }, []);

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
        {context.address ? <MyWallet address={context.address} hot={hot} /> : <Splash />}
      </main>
    </div>
  );
};

export default Home;
