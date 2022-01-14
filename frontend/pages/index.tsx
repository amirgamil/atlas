import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Nav from "../components/Nav";
import { useAppContext } from "../components/Context";
import Splash from "../components/Splash";
import MyWallet from "../components/MyWallet";

const Home: NextPage = () => {
  const context = useAppContext();

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
        {context.address ? <MyWallet address={context.address} /> : <Splash />}
      </main>
    </div>
  );
};

export default Home;
