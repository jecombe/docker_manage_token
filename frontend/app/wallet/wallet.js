"use client";
import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { CircleLoader } from "react-spinners";
import Matic from "../matic/matic";
import Usdc from "../usdc/usdc";
import Owner from "../owner/owner";
import { createWallet, getBalanceUser, getReadFunction, getReadFunctions } from "@/utils/request";
import io from "socket.io-client";

import { networks } from "@/utils/networks";
import "./wallet.css";
import Information from "../info/information";
import Swap from "../swap/swap";

export default function Wallet() {
  const [address, setAddress] = useState(null);

  const [balance, setBalance] = useState(null);
  const [balanceBusd, setBalanceBusd] = useState(null);
  const [balanceWbtc, setBalanceWbtc] = useState(null);


  const [isConnect, setIsConnect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);


  const [totalSupply, setTotalSupply] = useState(null);
  const [owner, setOwner] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [userResponse, setUserResponse] = useState(true);
  const [data, setData] = useState({})
  const [socket, setSocket] = useState(null)


  const getInfos = async (address) => {
    try {
      const balance = await getBalanceUser(address);

      setAddress(address);
      setBalance(balance);
      setIsConnect(true);

      const totalSupply = await getReadFunction("totalSupply");
      const ownerAddr = await getReadFunction("getOwner");
      const balanceOf = await getReadFunction("balanceOf", [address]);
      const balanceWBTC = await getReadFunctions("balanceOf", [address], "0xFa1e53C68c045589cb5BaC4B311337c9f42e2241", abi);
      setBalanceWbtc(balanceWBTC);

      setTotalSupply(formatEther(totalSupply));
      setOwner(ownerAddr);
      setBalanceBusd(balanceOf);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    checkNetwork();
  }, []);

  const connectWs = (address) => {
    console.log("CONNECTION", address);
    const socket = io('wss://jeremy.training.real-estate-executive.com', {
      query: { address }
    });
    setSocket(socket)

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socket.on("data", (data) => {
      console.log("Received message from server:", data);
      setShowPopup(true);
      setData(data);

      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    });

    socket.on("allData", (data) => {
      console.log("Received message from server:", data);
      if (data.fromaddress === address || data.toaddress === address) {

        setShowPopup(true);
        setData(data);

        setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      }
    });

  }

  /*useEffect(() => {

    return () => {
      socket.disconnect();
    };
  }, []);*/

  const updateBalance = async () => {
    try {
      if (isConnect) {
        console.log("UPDATE BALANCE");
        const balance = await getBalanceUser(address);

        const balanceOf = await getReadFunction("balanceOf", [address]);
        const balanceWBTC = await getReadFunctions("balanceOf", [address], "0xFa1e53C68c045589cb5BaC4B311337c9f42e2241", abi);
        setBalanceWbtc(balanceWBTC);


        setBalance(balance);
        setBalanceBusd(balanceOf);
      }
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        if (isConnect) {
          updateBalance();
        }
      } catch (error) {
        console.error("Error updating balances:", error);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isConnect, address]);

  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setIsConnect(false);
        setAddress(null);
        setBalance(null);
        setTotalSupply(null);
      } else {
        try {
          setIsLoading(true);
          await getInfos(accounts[0]);
        } catch (error) {
          setIsConnect(false);
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
    window.ethereum.on("chainChanged", handleNetworkChanged);

    return () => {
      window.ethereum.removeListener("chainChanged", handleNetworkChanged);
    };
  }, []);

  const connectToMumbai = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networks.sepolia.chainId }],
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error connecting to Sepolia testnet:", error);
      return error;
    }
  };

  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const networkId = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (networkId !== networks.sepolia.chainId) {
          const userResponse = window.confirm(
            "Please switch to Sepolia testnet network to use this application. Do you want to switch now?"
          );
          setUserResponse(userResponse);
          console.log(userResponse);
          if (userResponse) {
            await connectToMumbai();
          }
        }
        setCurrentNetwork(networkId);
      } catch (error) {
        console.error("Error checking network:", error);
        return error;
      }
    }
  };

  const handleNetworkChanged = async (networkId) => {
    setCurrentNetwork(networkId);
    checkNetwork();
  };

  const addNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [networks.zama],
      });
    } catch (error) {
      console.error("Error adding network:", error);
    }
  };

  async function handleClick() {
    if (isConnect) {
      setIsConnect(false);
      setAddress(null);
      setBalance(null);
      setTotalSupply(null);
    } else {
      try {
        setIsLoading(true);
        const client = createWallet();
        const [address] = await client.requestAddresses();
        connectWs(address)
        await getInfos(address);
      } catch (error) {
        setIsConnect(false);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <>
      <div>
        {showPopup && (
          <div className="popup">
            <p>name: {data.eventname} <br />
              value: {data.value}</p>
          </div>
        )}
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <button className="metamask-button" onClick={handleClick}>
          {isLoading ? (
            <CircleLoader color={"#000000"} loading={isLoading} />
          ) : (
            <>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="MetaMask Fox"
              />
              <span>{isConnect ? "Disconnect Wallet" : "Connect Wallet"}</span>
            </>
          )}
        </button>
        <h2>{address}</h2>
        <button className="zama-devnet-button" onClick={addNetwork}>
          Zama devnet
        </button>

        {isConnect ? (
          <button
            className="refresh-balances-button"
            onClick={updateBalance}
            disabled={isLoading}
          >
            Refresh Balances
          </button>
        ) : (
          ""
        )}

        {!userResponse ? (
          <div>
            <h1>Wrong network</h1>
            <h2>Connect to Sepolia testnet to use this dapp</h2>
          </div>
        ) : null}

        <hr style={{ width: "100%", borderTop: "3px solid black" }} />

        {isConnect && !isLoading ? (
          <>
            <Owner owner={owner} address={address} />
            <hr style={{ width: "100%", borderTop: "3px solid black" }} />

            <Matic
              address={address}
              balance={Math.round(Number(balance))}
              updateBalance={updateBalance}
            />
            <hr style={{ width: "100%", borderTop: "3px solid black" }} />
            <Usdc
              totalSupply={Math.round(totalSupply)}
              owner={owner}
              balanceBusd={balanceBusd}
              userAddr={address}
              getInfos={getInfos}
            />
            <hr style={{ width: "100%", borderTop: "3px solid black" }} />

            <Information userAddress={address} isConnect={isConnect} socket={socket} />

            <Swap balanceBusd={balanceBusd} balanceWbtc={balanceWbtc} addressUser={address}/>

          </>
        ) : (
          <h1> Need to connect to your metamask </h1>
        )}
      </div>
    </>
  );
}
