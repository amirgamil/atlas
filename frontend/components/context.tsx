import React, { useState, useContext } from "react";
import Web3Modal from "web3modal";
import { providers, Signer } from "ethers";

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
      /* See Provider Options Section */
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
