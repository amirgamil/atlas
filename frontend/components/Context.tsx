import React, { useState, useContext } from "react";
import Web3Modal from "web3modal";
import { providers, Signer } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Response, Account, FeedbackDetails } from "../types";
import axios from "axios";

interface Context {
  openModal: () => void;
  signOut: () => void;
  attemptLogin: () => void;
  signer?: providers.JsonRpcSigner;
  address?: string;
  recommendations: Account[];
  isLoadingRecommendations: boolean;
  loadRecommendations: (address: string) => void;
  updateRecommendations: (
    address: string,
    feedback: Record<string, FeedbackDetails>
  ) => void;
}

export const AppContext = React.createContext<Context>({
  openModal: () => {},
  signOut: () => {},
  attemptLogin: () => {},
  signer: undefined,
  address: "",
  recommendations: [],
  isLoadingRecommendations: false,
  loadRecommendations: () => {},
  updateRecommendations: () => {},
});

export const AppContextProvider = (props: any) => {
  const [signer, setSigner] = useState<providers.JsonRpcSigner | undefined>(
    undefined
  );
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Account[]>([]);

  const openModal = async () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            1: "https://eth-mainnet.alchemyapi.io/v2/3Gh_F9N6CievmzRNCVO1kfY2UUpxsWGC",
          },
        },
      },
    };

    const web3Modal = new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: false, // optional
      providerOptions, // required
    });
    web3Modal.clearCachedProvider();
    const provider = new providers.Web3Provider(await web3Modal.connect());
    const signer = provider.getSigner();

    setSigner(signer);

    const address = await signer.getAddress();
    setAddress(address);
    //loading recommendations for users can take a long time, so we start loading them as soon as they've
    //signed in
    loadRecommendations(address);
  };

  const updateRecommendations = (
    address: string,
    feedback: Record<string, FeedbackDetails>
  ) => {
    setIsLoadingRecommendations(true);
    console.log("updating recommendations");
    axios
      .post<Response>("http://localhost:3001/recommendFeedback", {
        params: {
          address: address,
        },
        body: {
          feedback,
        },
      })
      .then((recommendations) => {
        setIsLoadingRecommendations(false);
        setRecommendations(recommendations.data.results);
      });
  };

  const loadRecommendations = (address: string) => {
    setIsLoadingRecommendations(true);
    console.log("loading recommendations");
    axios
      .get<Response>("http://localhost:3001/recommend", {
        params: {
          address: address,
        },
      })
      .then((recommendations) => {
        setIsLoadingRecommendations(false);
        setRecommendations(recommendations.data.results);
      });
  };

  const signOut = () => {
    setSigner(undefined);
    setAddress(undefined);
    localStorage.setItem("WEB3_CONNECT_CACHED_PROVIDER", "");
  };

  const attemptLogin = async () => {
    if (
      localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER") &&
      typeof window.ethereum !== "undefined"
    ) {
      const provider = window.ethereum;
      const addresses = await provider.request({
        method: "eth_requestAccounts",
      });
      setSigner(provider);
      setAddress(addresses[0]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        openModal,
        signOut,
        attemptLogin,
        signer,
        address,
        recommendations,
        loadRecommendations,
        isLoadingRecommendations,
        updateRecommendations,
      }}
    >
      <>{props.children}</>
    </AppContext.Provider>
  );
};

export function useAppContext() {
  return useContext(AppContext);
}
