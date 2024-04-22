"use client";
import React, { useState } from "react";
import { parseEther } from "viem";
import { CircleLoader } from "react-spinners";
import "./matic.css";
import { parseNumberToEth } from "@/utils/utils";
import { sendTransaction, waitingTransaction } from "@/utils/request";

export default function Matic({ address, balance, updateBalance }) {
  const [sendLoading, setSendLoading] = useState(false);
  const [sendAmount, setSendAmount] = useState(0);
  const [recipient, setRecipient] = useState("");

  const handleSendSubmit = async (event) => {
    event.preventDefault();
    setSendLoading(true);
    try {
      const hash = await sendTransaction(
        parseEther(sendAmount),
        recipient,
        address
      );
      await waitingTransaction(hash);
      await updateBalance();
      setSendAmount(0);
      setRecipient("");
      setSendLoading(false);
    } catch (error) {
      console.error(error);
      setSendAmount(0);
      setRecipient("");
      setSendLoading(false);
    }
  };

  if (address) {
    return (
      <>
        <div className="matic-info-container">
          <h1>ETH</h1>
          <h2>Balance: {parseNumberToEth(balance)} ETH</h2>
        </div>
        <div className="matic-container">
          <div className="matic-details">
            <h2>Send ETH</h2>
          </div>
          {sendLoading ? (
            <div className="loader-container">
              <CircleLoader color={"#000000"} loading={sendLoading} />
            </div>
          ) : (
            <form className="send-form" onSubmit={handleSendSubmit}>
              <input
                className="address-input"
                type="text"
                placeholder="Recipient Address"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
              />
              <input
                className="amount-input"
                type="number"
                placeholder="Amount"
                value={sendAmount}
                onChange={(event) => setSendAmount(event.target.value)}
              />
              <button className="send-button" type="submit">
                Send
              </button>
            </form>
          )}
        </div>
      </>
    );
  }
}
