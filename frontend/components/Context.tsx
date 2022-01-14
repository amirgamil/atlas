import React, { useState, useContext } from "react";
import Web3Modal from "web3modal";
import { providers, Signer } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Response, Account } from "../types";
import axios from "axios";

interface Context {
  openModal: () => void;
  signOut: () => void;
  signer?: providers.JsonRpcSigner;
  address?: string;
  recommendations: Account[];
  isLoadingRecommendations: boolean;
  loadRecommendations: () => void;
}

export const AppContext = React.createContext<Context>({
  openModal: () => {},
  signOut: () => {},
  signer: undefined,
  address: "",
  recommendations: [],
  isLoadingRecommendations: false,
  loadRecommendations: () => {},
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
  };

  return (
    <AppContext.Provider
      value={{
        openModal,
        signOut,
        signer,
        address,
        recommendations,
        loadRecommendations,
      }}
    >
      <>{props.children}</>
    </AppContext.Provider>
  );
};

export function useAppContext() {
  return useContext(AppContext);
}
