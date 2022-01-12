import express from "express";
import cors from "cors";
import { generateRecommendationForAddr } from "./scraper/recommendation";
import { converter } from "./util";

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
        // @ts-ignore
        const address: string = req.query.address;
        const results = await generateRecommendationForAddr(address);
        res.json({ results });
    } catch (ex: unknown) {
        console.log(ex);
        res.status(503).send("Error occurred");
    }
});

//make sure that the server is running
app.listen(3001, () => {
    console.log(`Server is up at port ${3001}`);
    converter.loadCaches();
});
