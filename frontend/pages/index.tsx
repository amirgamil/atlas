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
  const [done, setDone] = React.useState<boolean>(false);

  context.attemptLogin();
  React.useEffect(() => {
    const canvas: any = document.getElementById("starfield");
    if (canvas) {
      const points: Star[] = [];
      const ctx = canvas.getContext("2d"); // Change to 1 on retina screens to see blurry canvas.
      let style_height = +getComputedStyle(canvas)
        .getPropertyValue("height")
        .slice(0, -2);
      //get CSS width
      let style_width = +getComputedStyle(canvas)
        .getPropertyValue("width")
        .slice(0, -2);
      const actualHeight = style_height * window.devicePixelRatio;
      const actualWidth = style_width * window.devicePixelRatio;
      //scale the canvas
      canvas.setAttribute("height", style_height * window.devicePixelRatio);
      canvas.setAttribute("width", style_width * window.devicePixelRatio);
      let i = 0;
      let id: number = 0;
      const updateStar = (star: Star) => {
        if (
          star.r > 2 * window.devicePixelRatio ||
          star.r < 0.8 * window.devicePixelRatio
        ) {
          star.rChange = -1 * star.rChange;
        }
        star.r += star.rChange * window.devicePixelRatio;
      };

      const updateAll = () => {
        for (const star of points) {
          //inject a little probability for which stars to update
          if (Math.random() > 0.25) {
            updateStar(star);
          }
        }
      };

      const drawStar = (star?: Star) => {
        const x = star
          ? star.x
          : Math.round(
              Math.random() * canvas.offsetWidth * window.devicePixelRatio
            );
        const y = star
          ? star.y
          : Math.round(
              Math.random() * canvas.offsetHeight * window.devicePixelRatio
            );
        ctx.beginPath();
        const radius = star ? star.r : valOrFloor(4 * Math.random(), 0.03);
        ctx.arc(x + 0.5, y, radius, 0, 2 * Math.PI, false);
        ctx.shadowBlur = 8;
        ctx.shadowColor = "white";
        const color = star
          ? star.color
          : `rgb(255, 255, 255, ${Math.random()})`;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        if (!star) {
          points.push({ x, y, rChange: 0.015, r: radius, color });
        }
        ctx.fill();
        ctx.stroke();
        i += 1;
      };

      const draw = (time: number) => {
        if (i < 700) {
          drawStar();
          window.requestAnimationFrame(draw);
        } else {
          animate(0);
          window.cancelAnimationFrame(id);
        }
      };
      let last = Date.now();
      const animate = (time: number) => {
        const now = Date.now();
        if (now - last > 5) {
          updateAll();
          ctx.fillStyle = "rgba(255, 255, 255, .1)";
          ctx.fillRect(0, 0, actualWidth, actualHeight);
          ctx.clearRect(0, 0, actualWidth, actualHeight);
          for (let arrStar = 0; arrStar < points.length; arrStar++) {
            drawStar(points[arrStar]);
          }
          last = now;
        }
        requestAnimationFrame(animate);
      };

      if (!context.address) {
        draw(0);
      } else {
        for (let count = 0; count < 700; count++) {
          drawStar();
        }
        animate(0);
      }
    }
  }, []);

  return (
    <div style={{ position: "relative" }} className={styles.container}>
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
