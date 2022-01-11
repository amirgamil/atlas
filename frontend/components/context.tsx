import React, { useState } from "react";
import Web3Modal from "web3modal";
import { providers, Signer } from "ethers";

export const AppContext = React.createContext({
  openModal: () => {},
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

  <AppContext.Provider
    value={{
      openModal,
    }}
  >
    <>{props.children}</>
  </AppContext.Provider>;
};
