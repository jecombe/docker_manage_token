import { ConnectWalletClient, ConnectPublicClient } from "./client";
import abi from "./abi";
import {
  createWalletClient,
  custom,
  formatEther,
  getContract,
  parseAbi,
} from "viem";
import { sepolia } from "viem/chains";
import { isAddressEqual } from "viem";
import _ from "lodash";
import { event, parseResult } from "./utils";
import wbtcAbi from "./abi/wbtc";

export const getWriteFunction = async (functionName, args, account) => {
  return ConnectWalletClient().writeContract({
    abi,
    account,
    functionName,
    address: process.env.CONTRACT,
    args,
  });
};

export const getWriteFunctions = async (functionName, args, account, address, abi) => {
  return ConnectWalletClient().writeContract({
    abi,
    account,
    functionName,
    address,
    args,
  });
};

export const getReadFunction = async (functionName, args) => {
  return ConnectPublicClient().readContract({
    address: process.env.CONTRACT,
    abi,
    functionName,
    args,
  });
};



export const getReadFunctions = async (functionName, args, address, abiC) => {
  return ConnectPublicClient().readContract({
    address,
    abi: abiC,
    functionName,
    args,
  });
};

export const getContractInfo = () => {
  return getContract({
    address: process.env.CONTRACT,
    abi,
    publicClient: ConnectPublicClient(),
    walletClient: ConnectWalletClient(),
  });
};

export const getContractInfos = (address, abiC) => {
  return {
    publicClient: ConnectPublicClient()
  }
};

export const createWallet = () => {
  return createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });
};

export const getBalanceUser = (address) => {
  return ConnectPublicClient().getBalance({ address });
};

export const waitingTransaction = (hash) => {
  return ConnectPublicClient().waitForTransactionReceipt({
    hash,
  });
};

export const waitingTransactions = (hash, publicClient) => {
  return publicClient.waitForTransactionReceipt({
    hash,
  });
};

export const sendTransaction = (value, to, account) => {
  return ConnectWalletClient().sendTransaction({
    to,
    account,
    value,
  });
};

export const parseNumberToEth = (number) => {
  return Number(formatEther(number.toString())).toFixed(2);
};

export const getActualBlock = () => {
  return ConnectPublicClient().getBlockNumber();
};

export const isAddressEq = (addressOne, addressTwo) => {
  return isAddressEqual(addressOne, addressTwo);
};

export const getEventLogs = async (logSave, i, blockNumber) => {
  try {
    const batchSize = BigInt(3000);

    const saveLength = logSave.length;

    let fromBlock = blockNumber - batchSize * BigInt(i + 1);
    let toBlock = blockNumber - batchSize * BigInt(i);

    const batchLogs = await ConnectPublicClient().getLogs({
      address: process.env.CONTRACT,
      events: parseAbi(event),
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    logSave = logSave.concat(parseResult(batchLogs));

    console.log(`Logs saved for request ${i + 1}:`, logSave.length, batchLogs);
    i++;

    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (logSave.length > saveLength) return { logSave, i, blockNumber };

    return { logSave, i, blockNumber };
  } catch (error) {
    return error;
  }
};
