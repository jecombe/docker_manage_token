
import dotenv from "dotenv";
import { formatEther, parseAbi } from "viem";
import { loggerServer } from "../utils/logger.js";
import { Viem } from "./Viem.js";
import { Manager } from "./Manager.js";
import _ from "lodash";
import { calculateBlocksPerDay, compareDates, removeTimeFromDate, subtractOneDay, waiting } from "../utils/utils.js";
import { LogEntry, LogOwner, ParsedLog } from "../utils/interfaces.js";

dotenv.config();

export class Contract extends Viem {

  manager: Manager;
  index: number;
  blockNumber: bigint;
  timePerRequest: number;
  isFetching: boolean;
  saveTx: string[];
  timeVolume: Date | null;
  saveTime: string[];
  isContractPrev: bigint;
  saveBatch: Date | null
  contractAddr: string;


  constructor(manager: Manager) {
    super();
    this.manager = manager;
    this.timeVolume = null;
    this.saveTx = [];
    this.saveTime = [];
    this.saveBatch = null;
    this.index = 0;
    this.isFetching = true;
    this.blockNumber = BigInt(0);
    this.isContractPrev = BigInt(0);
    this.timePerRequest = this.getRateLimits();
    this.contractAddr = `${process.env.CONTRACT}`;

  }
  async startAfterReset() {
    try {
      this.isFetching = true;
      await this.getLogsContract();
    } catch (error) {
      loggerServer.fatal("resetFetching: ", error);
      this.isFetching = false;
    }
  }

  async resetFetching() {
    this.timeVolume = null;
    this.saveTx = [];
    this.saveTime = [];
    this.saveBatch = null;
    this.index = 0;
    this.isFetching = false;
    this.blockNumber = BigInt(0);
    this.isContractPrev = BigInt(0);
  }

  parseNumberToEth(number: string) {
    const numberBigInt: bigint = BigInt(number);
    return Number(formatEther(numberBigInt));
  };


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

  isElementInArray(array: string[], element: Date) {
    const ts = removeTimeFromDate(element)
    const timestamp = ts.toISOString().split('T')[0]

    return array.map(String).includes(timestamp);
  }

  async sendVolumeDaily(volume: number): Promise<void> {

    if (this.timeVolume && !this.isElementInArray(this.saveTime, this.timeVolume)) {
      const ts = removeTimeFromDate(this.timeVolume)
      const timestamp = ts.toISOString().split('T')[0]
      this.saveTime.push(timestamp)

      this.manager.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` })

      return this.manager.insertDataVolumes(timestamp, volume);
    } else {
      loggerServer.warn("is Exist", volume);

      if (this.timeVolume && volume) {
        const ts = removeTimeFromDate(this.timeVolume)
        const timestamp = ts.toISOString().split('T')[0]
        this.manager.updateDataVolumes(this.timeVolume, volume);
        this.manager.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` })

      }
    }
  }

  parsingWs(repWs: any) {
    return {
      blocknumber: repWs.blockNumber,
      eventname: repWs.eventName,
      fromaddress: repWs.from,
      toaddress: repWs.to,
      transactionhash: repWs.transactionHash,
      value: repWs.value
    }
  }


  async sendData(parsed: ParsedLog[], isRealTime: boolean): Promise<void> {
    try {


      for (const el of parsed) {
        if (!_.includes(this.saveTx, el.transactionHash)) {
          await this.manager.insertDataLogs(el);

          const socketIdTo = this.manager.users[el.to]?.socketId;
          const socketIdFrom = this.manager.users[el.from]?.socketId;


          if (socketIdTo && isRealTime) this.manager.sendDataToClientWithAddress(socketIdTo, this.parsingWs(el));
          if (socketIdFrom && isRealTime) this.manager.sendDataToClientWithAddress(socketIdFrom, this.parsingWs(el));

          if (socketIdTo) this.manager.sendWsToClient(socketIdTo, this.parsingWs(el));
          if (socketIdFrom) this.manager.sendWsToClient(socketIdFrom, this.parsingWs(el));

          this.manager.sendWsToAllClients(this.parsingWs(el));

          this.saveTx.push(el.transactionHash);
        }
      }
    } catch (error) {
      loggerServer.fatal("sendData: ", error);
      throw error;
    }
  }

  isExist(array: ParsedLog[]): ParsedLog[] {

    return array.reduce((acc: ParsedLog[], el: ParsedLog) => {
      if (!_.includes(this.saveTx, el.transactionHash)) {
        acc.push(el);
      }

      return acc;
    }, []);
  }

  getRangeBlock(batchSize: bigint): { fromBlock: bigint; toBlock: bigint } {
    const fromBlock: bigint = this.blockNumber - batchSize * BigInt(this.index + 1);
    const toBlock: bigint = this.blockNumber - batchSize * BigInt(this.index);
    return { fromBlock, toBlock };
  }

  async getBatchLogs(fromBlock: bigint, toBlock: bigint): Promise<LogEntry[]> {
    return this.cliPublic.getLogs({
      address: `0x${this.contractAddr}`,
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
      address: `0x${this.contractAddr}`,
      events: parseAbi([
        "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
      ]),
      fromBlock,
      toBlock,
    });
  }


  calculateVolume(logs: ParsedLog[]): string {
    let volume = BigInt(0);
    for (const log of logs) {
      if (log.eventName === 'Transfer') {
        let value = BigInt(0);
        
        const numericValue = Math.round(log.value * 33); // Arrondir et convertir en entier
        value = BigInt(numericValue); // Convertir en BigInt
        
        console.log(value); // Assurez-vous que value est un nombre entier
        
        volume += value;
      }
    }

    return volume.toString();
  }
  /*calculateVolume(logs: ParsedLog[]): string {
    let volume: bigint = BigInt(0);
    for (const log of logs) {
      if (log.eventName === 'Transfer') {
        volume += BigInt(log.value);
      }
    }
    return `${volume}`;
  }
  */

  savingTx(parsed: ParsedLog[]) {
    parsed.map((el: ParsedLog) => {
      _.union(this.saveTx, el.transactionHash);
    });
  }

  async sendLogsWithCheck(parsed: ParsedLog[], isRealTime: boolean): Promise<void> {
    try {
      if (!_.isEmpty(parsed)) {
        const checkExisting: ParsedLog[] = this.isExist(parsed);
        this.sendVolumeDaily(Number(this.calculateVolume(checkExisting)));

        if (!_.isEmpty(checkExisting)) {

          loggerServer.trace("Adding new thing: ", checkExisting, parsed, this.saveTx);

          await this.sendData(checkExisting, isRealTime);
        } else {
          loggerServer.error("Log already existe");
        }

      }
    } catch (error) {
      loggerServer.fatal("sendLogsWithCheck", error);
      throw error;
    }
  }

  loggingDate() {
    const dateRemoveHours = removeTimeFromDate(this?.timeVolume || new Date());
    loggerServer.trace("Analyze Data for day: ", dateRemoveHours.toISOString().split('T')[0]);
  }

  contractIsPreviousOwner(obj: LogOwner): bigint {
    if (obj.eventName !== "OwnershipTransferred") return BigInt(0);

    if (obj.args.previousOwner === "0x0000000000000000000000000000000000000000") {
      return obj.blockNumber;
    }
    return BigInt(0);
  }

  async manageProcessRequest(): Promise<ParsedLog[]> {

    try {

      const { fromBlock, toBlock } = this.getRangeBlock(BigInt(calculateBlocksPerDay(this.manager.config.timeBlock)));

      const batchLogs: LogEntry[] = await this.getBatchLogs(fromBlock, toBlock);
      const owner: LogOwner[] = await this.getLogsOwnerShip(fromBlock, toBlock);

      if (!_.isEmpty(owner)) this.isContractPrev = this.contractIsPreviousOwner(owner[0]);

      return this.parseResult(batchLogs);

    } catch (error) {
      loggerServer.fatal("manageProcessRequest", error);
      throw error;
    }
  }

  async getEventsLogsFrom(): Promise<boolean> {
    try {
      let isOk = false;

      this.isContractPrev = BigInt(0);

      if (!this.isFetching) return true;

      this.loggingDate();

      const parsed = await this.manageProcessRequest();

      await this.sendLogsWithCheck(parsed, false);

      if (this.saveBatch && this.timeVolume && !compareDates(this.saveBatch, this.timeVolume)) isOk = true

      if (!this.saveBatch) isOk = true;

      if (isOk) this.index++;


      if (this.timeVolume && isOk) this.timeVolume = subtractOneDay(this.timeVolume);

      if (this.isContractPrev !== BigInt(0)) return true;

      return false;
    } catch (error) {
      loggerServer.fatal("getEventsLogsFrom: ", error);
      throw error;
    }
  }

  getRateLimits(): number {
    const requestsPerMinute: number = 1800;
    const millisecondsPerMinute: number = 60000;
    return millisecondsPerMinute / requestsPerMinute;
  };

  async newFetching(): Promise<void> {
    try {
      this.timeVolume = removeTimeFromDate(new Date());
      this.blockNumber = BigInt(await this.getActualBlock());
      loggerServer.info("new fetching with actual block: ", this.blockNumber.toString());

    } catch (error) {
      loggerServer.fatal("newFetching: ", error);
      this.timeVolume = removeTimeFromDate(new Date());
      this.blockNumber = BigInt(0);
      throw error;
    }
  }

  async getLogsContract(): Promise<void> {
    try {
      await this.newFetching();

      while (this.isFetching) {
        loggerServer.warn("+++++++++++++++++++---------------------------------------", this.saveTime);

        const isStop = await this.processLogsBatch();
        await waiting(this.manager.config.waiting);
        if (isStop) {
          loggerServer.warn("process fetching is stop -> smart contract is born", this.saveTime);
          this.index = 0;
          loggerServer.info("waiting for a new fetching...");
          this.saveBatch = removeTimeFromDate(new Date())
          this.saveBatch.toISOString().split('T')[0]


          // await waiting(this.manager.config.waiting);
          await this.newFetching();
        }
        //this.isFetchAll = false;
      }
    } catch (error) {
      loggerServer.fatal("getLogsContract: ", error);
      this.isFetching = false;
      throw error;
    }
  };

  async waitingRate(batchStartTime: number, timePerRequest: number): Promise<void> {
    const elapsedTime: number = Date.now() - batchStartTime;
    const waitTime: number = Math.max(0, timePerRequest - elapsedTime);
    loggerServer.debug("Elapsed time:", elapsedTime, "Wait time:", waitTime);
    return waiting(waitTime);
  };


  async processLogsBatch(): Promise<boolean> {
    const batchStartTime: number = Date.now();

    try {
      const isStop = await this.getEventsLogsFrom();
      await this.waitingRate(batchStartTime, this.timePerRequest);
      return isStop;
    } catch (error) {
      loggerServer.error("processLogsBatch: ", error);
      throw error;
    }
  };



  async startListeningEvents(): Promise<void> {
    try {
      //this.startListener();
      await this.getLogsContract();
    } catch (error) {
      loggerServer.fatal("startListeningEvents: ", error);
      throw error;
    }

  }
}