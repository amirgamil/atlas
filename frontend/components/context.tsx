import React, { useState, useContext } from "react";
import Web3Modal from "web3modal";
import { providers, Signer } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";

interface Context {
  openModal: () => void;
  signer?: providers.JsonRpcSigner;
  address?: string;
}

export const AppContext = React.createContext<Context>({
  openModal: () => {},
  signer: undefined,
  address: "",
});

export const AppContextProvider = (props: any) => {
  const [signer, setSigner] = useState<providers.JsonRpcSigner | undefined>(
    undefined
  );
  const [address, setAddress] = useState<string | undefined>(undefined);

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
      cacheProvider: true, // optional
      providerOptions, // required
    });
    const provider = new providers.Web3Provider(await web3Modal.connect());
    const signer = provider.getSigner();

    setSigner(signer);

    const address = await signer.getAddress();
    setAddress(address);
  };

  return (
    <AppContext.Provider
      value={{
        openModal,
        signer,
        address,
      }}
    >
      <>{props.children}</>
    </AppContext.Provider>
  );
};

export function useAppContext() {
  return useContext(AppContext);
}
