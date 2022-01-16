import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Nav from "../components/Nav";
import { useAppContext } from "../components/Context";
import Splash from "../components/Splash";
import MyWallet from "../components/MyWallet";
import * as React from "react";

interface Star {
  x: number;
  y: number;
  rChange: number;
  r: number;
  color: string;
}

const valOrFloor = (val: number, floor: number) => {
  if (val < floor) {
    return floor;
  }
  return val;
};

const Home: NextPage = () => {
  const context = useAppContext();
  context.attemptLogin();

  return (
    <div style={{ position: "relative" }} className={styles.container}>
      {!context.address && (
        <div
          id="effectsLayer"
          style={{
            overflow: "hidden",
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <div id="stars">
            {Array(1000)
              .fill(0)
              .map(() => {
                const s = 0.5 + Math.random();
                const curR = 300 + Math.random() * 1800;
                return (
                  <div
                    className="star"
                    style={{
                      transformOrigin: `0 0 ${curR}px`,
                      transform: `translate3d(0,0,-${curR}px) rotateY(${
                        Math.random() * 360
                      }deg) rotateX(${
                        Math.random() * -50
                      }deg) scale(${s}, ${s})`,
                    }}
                  />
                );
              })}
          </div>
        </div>
      )}
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
      <main className={`overflow-y-auto ${styles.main} z-10`}>
        {context.address ? <MyWallet address={context.address} /> : <Splash />}
      </main>
    </div>
  );
};

export default Home;
