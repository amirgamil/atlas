import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";

import Nav from "../components/nav";
import SafeHydrate from "../components/safehydrate";
import { useAppContext } from "../components/context";
import { useEffect, useState } from "react";
import constants from "../constants";
import axios from "axios";
import { utils } from "ethers";
import useDebounce from "../hooks/useDebounce";

const Graph = dynamic(() => import("../components/graph"), { ssr: false });

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
    const [hot, setHot] = useState<Array<Account>>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        // Get hot contracts
        const f = async () => {
            const res = await axios.get<Response>(`${constants.serverUri}/hot`);
            const results = res.data.results;
            setHot(results);
        };

        setAddress(context.address ?? "");
        f();
    }, []);

    return (
        <div className={styles.container}>
            <Nav />
            <Head>
                <title>Create Next App</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <div>
                    <h1 className="text-center py-4">Transaction Graph</h1>
                    <div className="mt-1">
                        <div className="mb-2">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                className="h-16 ring-offset-2 outline-none ring-2 block w-full sm:text-sm p-4"
                                placeholder="Contract Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                        <div className="w-full flex justify-center items-center mt-10">
                            <button
                                style={{
                                    background: "#4287f5",
                                    color: "white",
                                }}
                                className="rounded-md px-4 py-3 text-md"
                                onClick={async () => {
                                    setLoading(true);
                                    const recommendations =
                                        await axios.get<Response>(
                                            "http://localhost:3001/recommend",
                                            {
                                                params: { address: address },
                                            }
                                        );
                                    console.log("recommended: ", recommended);
                                    setRecommended(
                                        recommendations.data.results
                                    );
                                    setLoading(false);
                                }}
                            >
                                Get recommendation
                            </button>
                        </div>
                    </div>
                    {address ? (
                        <SafeHydrate>
                            <Graph user={address} />
                        </SafeHydrate>
                    ) : null}
                    <div className="text-center mt-6">
                        {hot.length > 0 ? (
                            <div>
                                <h1 className="text-center">Hot Contracts</h1>
                                {hot.map((a, i) => (
                                    <div key={i}>
                                        <a
                                            href={`https://etherscan.io/address/${a.addr}`}
                                        >
                                            {a.name ? a.name : a.addr}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <div className="text-center mt-6">
                        {loading ? (
                            <p>Learning your deepest darkest secrets</p>
                        ) : null}
                        {recommended.length > 0 ? (
                            <div>
                                <h1 className="text-center">
                                    Your Recommendations
                                </h1>
                                {recommended.map((a) => (
                                    <div>
                                        <a
                                            href={`https://etherscan.io/address/${a.addr}`}
                                        >
                                            {a.name}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <a
                    href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Made with ❤️
                </a>
            </footer>
        </div>
    );
};

export default Home;
