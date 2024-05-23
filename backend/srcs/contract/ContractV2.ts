
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import { Viem } from "./Viem.js";
import _ from "lodash";
import { calculateBlocksPerDay, getRangeBlock } from "../../utils/utils.js";
import { LogEntry, LogOwner, ParsedLog } from "../../utils/interfaces.js";
import { Log, parseAbi } from "viem";

dotenv.config();

export class ContractV2 extends Viem {
  isContractPrev: bigint;
  blockNumber: bigint;


  constructor() {
    super();
    this.isContractPrev = BigInt(0);
    this.blockNumber = BigInt(0);
  }

  initParsingLog(currentLog: LogEntry): ParsedLog {
    return {
      eventName: currentLog.eventName,
      from: "",
      to: "",
      blockNumber: currentLog.blockNumber.toString(),
      value: 0,
      transactionHash: currentLog.transactionHash,
    };
  }


  parseResult(logs: LogEntry[]): ParsedLog[] {
    return logs.reduce((accumulator: ParsedLog[], currentLog: LogEntry) => {

      const parsedLog: ParsedLog = this.initParsingLog(currentLog);

      if (currentLog.eventName === "Transfer" && currentLog.args.from && currentLog.args.to) {
        parsedLog.from = currentLog.args.from;
        parsedLog.to = currentLog.args.to;
        parsedLog.value = this.parseNumberToEth(`${currentLog.args.value}`);
        parsedLog.transactionHash = currentLog.transactionHash;
      }

      else if (currentLog.eventName === "Approval" && currentLog.args.owner && (currentLog.args.sender || currentLog.args.spender)) {
        parsedLog.from = currentLog.args.owner;
        parsedLog.to = (currentLog.args?.sender || currentLog.args?.spender) || '';
        parsedLog.value = this.parseNumberToEth(`${currentLog.args.value}`);
        parsedLog.transactionHash = currentLog.transactionHash;
      }
      else loggerServer.info("Uknow envent come here: ", currentLog);

      accumulator.push(parsedLog);
      return accumulator;
    }, []);
  }

  async setActualBlock() {
    try {
      this.blockNumber = BigInt(await this.getActualBlock());
    } catch (error) {
      loggerServer.fatal("Error SetActualBlock: ", error)
      this.blockNumber = BigInt(0);
    }
  }

  parseLogListener(logs: Log[]): LogEntry[] {
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


  startFetchingLogs(callback: (logs: ParsedLog[]) => void): void {
    this.startListener((logs: Log[]) => {
      const finalParse = this.parseResult(this.parseLogListener(logs));
      callback(finalParse);
    });
  }

  async getBatchLogs(fromBlock: bigint, toBlock: bigint): Promise<LogEntry[]> {
    return this.cliPublic.getLogs({
      address: `0x${process.env.CONTRACT}`,
      events: parseAbi([
        "event Approval(address indexed owner, address indexed sender, uint256 value)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
      ]),
      fromBlock,
      toBlock,
    });
  }

  async getLogsOwnerShip(fromBlock: bigint, toBlock: bigint): Promise<LogOwner[]> {
    return this.cliPublic.getLogs({
      address: `0x${process.env.CONTRACT}`,
      events: parseAbi([
        "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
      ]),
      fromBlock,
      toBlock,
    });
  }

  parseNumberToEth(number: string) {
    const numberBigInt: bigint = BigInt(number);
    return Number(this.formatEther(numberBigInt));
  };


  contractIsPreviousOwner(obj: LogOwner): bigint {
    if (obj.eventName !== "OwnershipTransferred") return BigInt(0);

    if (obj.args.previousOwner === "0x0000000000000000000000000000000000000000") {
      return obj.blockNumber;
    }
    return BigInt(0);
  }


  async manageProcessRequest(index: number, blockNumber: bigint): Promise<ParsedLog[]> {
    try {
      const { fromBlock, toBlock } = getRangeBlock(BigInt(calculateBlocksPerDay(14)), index, blockNumber);

      const batchLogs: LogEntry[] = await this.getBatchLogs(fromBlock, toBlock);
      const owner: LogOwner[] = await this.getLogsOwnerShip(fromBlock, toBlock);

      if (!_.isEmpty(owner)) this.isContractPrev = this.contractIsPreviousOwner(owner[0]);

      return this.parseResult(batchLogs);

    } catch (error) {
      loggerServer.fatal("manageProcessRequest", error);
      throw error;
    }
  }
}