
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import { Viem } from "./Viem.js";
import { calculateBlocksPerDay, getRangeBlock } from "../../utils/utils.js";
import { LogEntry, Opt, ParsedLog } from "../../utils/interfaces.js";
import { Log, parseAbi } from "viem";

dotenv.config();

const ADDR_NULL = "0x0000000000000000000000000000000000000000";

export class ContractV2 extends Viem {
  isContractPrev: bigint;
  blockNumber: bigint;

  constructor(opt: Opt) {
    super(opt);
    this.isContractPrev = BigInt(0);
    this.blockNumber = BigInt(0);
  }

  // PRIVATE
  private initParsingLog(currentLog: LogEntry): ParsedLog {
    return {
      eventName: currentLog.eventName,
      from: "",
      to: "",
      blockNumber: currentLog.blockNumber.toString(),
      value: 0,
      transactionHash: currentLog.transactionHash,
    };
  }

  private parseLogListener(logs: Log[]): LogEntry[] {
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

  private parseResult(logs: LogEntry[]): ParsedLog[] {
    return logs.reduce((accumulator: ParsedLog[], currentLog: LogEntry) => {

      const parsedLog: ParsedLog = this.initParsingLog(currentLog);
      
      this.contractIsPreviousOwner(currentLog);      

      if (this.isContractPrev === BigInt(0)) {
        if (!this.processTransfer(currentLog, parsedLog) && !this.processApproval(currentLog, parsedLog)) {
          loggerServer.fatal("Uknow envent come here: ", currentLog);
        }
      }
      accumulator.push(parsedLog);

      return accumulator;
    }, []);
  }

  private processTransfer(currentLog: LogEntry, parsedLog: ParsedLog) {
    if (currentLog.eventName === "Transfer" && currentLog.args.from && currentLog.args.to) {
      parsedLog.from = currentLog.args.from;
      parsedLog.to = currentLog.args.to;
      parsedLog.value = Number(this.formatEther(BigInt(`${currentLog.args.value}`)));
      parsedLog.transactionHash = currentLog.transactionHash;
      return true;
    }
    return false;
  }

  private processApproval(currentLog: LogEntry, parsedLog: ParsedLog) {
    if (currentLog.eventName === "Approval" && currentLog.args.owner && (currentLog.args.sender || currentLog.args.spender)) {
      parsedLog.from = currentLog.args.owner;
      parsedLog.to = (currentLog.args?.sender || currentLog.args?.spender) || '';
      parsedLog.value = Number(this.formatEther(BigInt(`${currentLog.args.value}`)));
      parsedLog.transactionHash = currentLog.transactionHash;
      return true;
    }
    return false;
  }


  async setActualBlock() {
    try {
      this.blockNumber = BigInt(await this.getActualBlock());
    } catch (error) {
      loggerServer.fatal("Error SetActualBlock: ", error);
      this.blockNumber = BigInt(0);
    }
  }

  startFetchingLogs(callback: (logs: ParsedLog[]) => void) {
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
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
      ]),
      fromBlock,
      toBlock,
    });
  }


  contractIsPreviousOwner(obj: LogEntry) {    
    if (obj.eventName !== "OwnershipTransferred") return;

    if (obj.args.previousOwner === ADDR_NULL) {
      this.isContractPrev = obj.blockNumber;      
    }
  }

  async manageProcessRequest(index: number, blockNumber: bigint): Promise<ParsedLog[]> {
    try {
      const { fromBlock, toBlock } = getRangeBlock(BigInt(calculateBlocksPerDay(14)), index, blockNumber);

      /*const batchLogs = await this.getLogs(fromBlock, toBlock, [
        "event Approval(address indexed owner, address indexed sender, uint256 value)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
      ])*/
      const batchLogs = await this.getBatchLogs(fromBlock, toBlock);

      return this.parseResult(batchLogs);

    } catch (error) {
      loggerServer.fatal("manageProcessRequest", error);
      throw error;
    }
  }
}