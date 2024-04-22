import { formatEther, isAddressEqual } from "viem";
import _ from "lodash";

const skipAddress = ["0x0000000000000000000000000000000000000000"];

const isAddressSkipped = (address) => {
  return skipAddress.includes(address.toLowerCase());
};

export const filterAddresses = (addresses) => {
  return skipAddress.includes(addresses);
};

export const parseNumberToEth = (number) => {
  console.log(number);
  return Number(formatEther(number.toString()))
};

export const isAddressEq = (addressOne, addressTwo) => {
  const isOne = isAddressSkipped(addressOne);
  const isTwo = isAddressSkipped(addressTwo);

  if (!isOne && !isTwo) {
    return isAddressEqual(addressOne, addressTwo);
  }

  return false;
};

export const parseResult = (logs) => {
  return logs.reduce((accumulator, currentLog) => {
    const { args, eventName, blockNumber, transactionHash } = currentLog;

    let parsedLog = {};

    if (eventName === "Transfer") {
      parsedLog = {
        eventName: "transfer",
        from: args.from,
        to: args.to,
        blockNumber: blockNumber.toString(),
        value: parseNumberToEth(args.value),
        transactionHash,
      };
      accumulator.push(parsedLog);
    }

    if (eventName === "Approval") {
      parsedLog = {
        eventName: "approval",
        blockNumber: blockNumber.toString(),
        owner: args.owner,
        sender: args.sender,
        value: parseNumberToEth(args.value),
        transactionHash,
      };
      accumulator.push(parsedLog);
    }
    return accumulator;
  }, []);
};

export const event = [
  "event Approval(address indexed owner, address indexed sender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
];

export const parseAllowance = (event) => {
  return event.reduce((accumulator, currentValue) => {
    if (currentValue.eventName === "approval") {
      accumulator.push(currentValue);
    }
    return accumulator;
  }, []);
};

export const parseUserLogs = (event, addressUser) => {
  return event.reduce((accumulator, currentValue) => {
    if (isAddressEq(addressUser, currentValue?.owner || currentValue?.from)) {
      accumulator.push(currentValue);
    }
    return accumulator;
  }, []);
};

export const waitingRate = async (batchStartTime, timePerRequest) => {
  const elapsedTime = Date.now() - batchStartTime;
  const waitTime = Math.max(0, timePerRequest - elapsedTime);
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

export const getRateLimits = () => {
  const requestsPerMinute = 1800;
  const millisecondsPerMinute = 60000;
  return millisecondsPerMinute / requestsPerMinute;
};
