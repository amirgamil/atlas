import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Nav from "../components/Nav";
import { useAppContext } from "../components/Context";
import Splash from "../components/Splash";
import MyWallet from "../components/MyWallet";
import * as React from "react";

const Home: NextPage = () => {
  const context = useAppContext();

  context.attemptLogin();
  React.useEffect(() => {
    const canvas: any = document.getElementById("starfield");
    const twinklers = [];
    if (canvas) {
      const points = [];
      const ctx = canvas.getContext("2d"); // Change to 1 on retina screens to see blurry canvas.
      let style_height = +getComputedStyle(canvas)
        .getPropertyValue("height")
        .slice(0, -2);
      //get CSS width
      let style_width = +getComputedStyle(canvas)
        .getPropertyValue("width")
        .slice(0, -2);
      //scale the canvas
      canvas.setAttribute("height", style_height * window.devicePixelRatio);
      canvas.setAttribute("width", style_width * window.devicePixelRatio);
      for (var i = 0; i < 1000; i++) {
        const x = Math.round(
          Math.random() * canvas.offsetWidth * window.devicePixelRatio
        );
        const y = Math.round(
          Math.random() * canvas.offsetHeight * window.devicePixelRatio
        );
        ctx.beginPath();
        ctx.arc(x + 0.5, y, 4 * Math.random(), 0, 2 * Math.PI, false);
        const color = `rgb(255, 255, 255, ${Math.random()})`;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        // ctx.fillRect(x, y, 3 * Math.random(), 3 * Math.random());
        if (i % 10 === 0) {
          points.push({ x, y });
        }
      }
    }
  });

  return (
    <div style={{ position: "relative" }} className={styles.container}>
      {!context.address ? (
        <canvas
          style={{
            zIndex: 0,
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          id="starfield"
          className="absolute"
        ></canvas>
      ) : null}
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
