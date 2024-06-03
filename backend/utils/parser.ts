
import { loggerServer } from "../utils/logger.js";
import { LogEntry, ParsedLog } from "../utils/interfaces.js";
import { Log, formatEther } from "viem";

  export const initParsingLog = (currentLog: LogEntry): ParsedLog => {
    return {
      eventName: currentLog.eventName,
      from: "",
      to: "",
      blockNumber: currentLog.blockNumber.toString(),
      value: 0,
      transactionHash: currentLog.transactionHash,
    };
  }

  export const parseLogListener = (logs: Log[]): LogEntry[] => {
    const convertedLogs: LogEntry[] = logs.map((log: any) => {
      const convertedLog: LogEntry = {
        args: log.args,
        eventName: log.eventName,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      };

      return convertedLog;
    });

    return convertedLogs;
  }

  export const parsingWs = (repWs: ParsedLog) => {
    return {
      blocknumber: repWs.blockNumber,
      eventname: repWs.eventName,
      fromaddress: repWs.from,
      toaddress: repWs.to,
      transactionhash: repWs.transactionHash,
      value: repWs.value
    };
  }


  export const parseLogEntryToParsed = (logs: LogEntry[]): ParsedLog[] => {
    return logs.reduce((accumulator: ParsedLog[], currentLog: LogEntry) => {      

      const parsedLog: ParsedLog = initParsingLog(currentLog);
      
      if (!parseLogEntryTransfer(currentLog, parsedLog) && !parseLogEntryApproval(currentLog, parsedLog)) {
        loggerServer.fatal("Uknow envent come here: ", currentLog);
      }
      
      accumulator.push(parsedLog);

      return accumulator;
    }, []);
  }

  export const parseLogEntryTransfer = (currentLog: LogEntry, parsedLog: ParsedLog) => {
    if (currentLog.eventName === "Transfer" && currentLog.args.from && currentLog.args.to) {
      parsedLog.from = currentLog.args.from;
      parsedLog.to = currentLog.args.to;
      parsedLog.value = Number(formatEther(BigInt(`${currentLog.args.value}`)));
      parsedLog.transactionHash = currentLog.transactionHash;
      return true;
    }
    return false;
  }

  export const parseLogEntryApproval = (currentLog: LogEntry, parsedLog: ParsedLog) => {
    if (currentLog.eventName === "Approval" && currentLog.args.owner && (currentLog.args.sender || currentLog.args.spender)) {
      parsedLog.from = currentLog.args.owner;
      parsedLog.to = (currentLog.args?.sender || currentLog.args?.spender) || '';
      parsedLog.value = Number(formatEther(BigInt(`${currentLog.args.value}`)));
      parsedLog.transactionHash = currentLog.transactionHash;
      return true;
    }
    return false;
  }
