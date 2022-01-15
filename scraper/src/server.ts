import express from "express";
import cors from "cors";
import {
  generateRecommendationForAddr,
  getHotContracts,
  getSimilarContracts,
  submitFeedback,
} from "./scraper/recommendation";
import { converter, getTokensForAddress } from "./util";
import { init } from "./neo4jWrapper";
import getName from "./names";

const app = express();
//CHANGE FOR PROD
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/recommend", async (req, res, next) => {
  try {
    console.log("recommending...");
    // @ts-ignore
    const address: string = req.query.address;
    const results = await generateRecommendationForAddr(address);
    console.log("recommended: ", results);
    res.json({ results });
  } catch (ex: unknown) {
    console.log(ex);
    res.status(503).send("Error occurred");
  }
});

app.get("/feedback", async (req, res, next) => {
  // @ts-ignore
});

app.get("/hot", async (req, res) => {
  try {
    console.log("getting results");
    const results = await getHotContracts(10);
    const out = results.map((r) => ({ ...r, name: getName(r.addr) }));
    res.json({ results: out });
  } catch (err: any) {
    console.log(err);
    res.status(503).send("Error");
  }
});

app.get("/similar-neighbors", async (req, res) => {
  try {
    const address = req.query.address as string;
    const similar = await getSimilarContracts(address);
    //@ts-ignore
    const out = similar.map((r) => ({ ...r, name: getName(r.address) }));
    console.log(out);
    res.json(out.slice(0, 4));
  } catch (err: any) {
    console.log(err);
    res.status(503).send("Error");
  }
});

app.get("/tokens", async (req, res) => {
  try {
    const address = req.query.address as string;
    const tokens = await getTokensForAddress(address);
    res.json(tokens);
  } catch (err: any) {
    console.log(err);
    res.status(503).send("Error");
  }
});

app.post("/recommendFeedback", async (req, res, next) => {
  try {
    //@ts-ignore
    const results = await submitFeedback(req.body.address, req.body.feedback);
    console.log("results: ", results);
    res.send({ results });
  } catch (ex: unknown) {
    console.log(ex);
    res.status(503).send("Error");
  }
});

//make sure that the server is running
app.listen(3001, () => {
  init();
  console.log(`Server is up at port ${3001}`);
  converter.loadCaches();
});
