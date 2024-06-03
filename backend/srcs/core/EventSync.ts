
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import { compareDates, getRateLimits, loggingDate, removeTimeFromDate, subtractOneDay, waiting, waitingRate } from "../../utils/utils.js";
import { LogEntry, Opt, ParsedLog } from "../../utils/interfaces.js";
import { Log, parseAbi } from "viem";
import { calculateBlocksPerDay, getRangeBlock } from "../../utils/utils.js";
import { DataBaseV2 } from "../database/DatabaseV2.js";
import { ViemClient } from "../contract/ViemClient.js";
import _ from "lodash";
import { SocketClient } from "../server/Socket.js";
import { parseLogListener, parseLogEntryToParsed } from "../../utils/parser.js";

const ADDR_NULL = "0x0000000000000000000000000000000000000000";

dotenv.config();

export class EventSync {
  index: number;
  viemClient: ViemClient;
  timePerRequest: number;
  isFetching: boolean;
  timeVolume: Date | null;
  timeNow: Date | null;
  opt: Opt;
  isContractPrev: bigint;
  blockNumber: bigint;
  database: DataBaseV2;
  socket: SocketClient;

  constructor(viemClient: ViemClient, opt: Opt, database: DataBaseV2, socket: SocketClient) {
    this.database = database;
    this.socket = socket;
    this.opt = opt;
    this.timeVolume = null;
    this.viemClient = viemClient;
    this.timeNow = null;
    this.index = 0;
    this.isFetching = true;
    this.isContractPrev = BigInt(0);
    this.blockNumber = BigInt(0);
    this.timePerRequest = getRateLimits();
  }

  async startAfterReset() {
    try {
      this.isFetching = true;
      await this.getLogsFromHttp();
    } catch (error) {
      loggerServer.fatal("resetFetching: ", error);
      this.isFetching = false;
    }
  }

  async resetFetching() {
    this.isFetching = false;
    this.index = 0;
    this.timeNow = null;
  }
  
  private checkContractBorn(logs: LogEntry[]) {
    logs.map((currentLog: LogEntry) => {      

      this.contractIsPreviousOwner(currentLog);      
  
    }, []);
  }

  async setActualBlock() {
    try {
      this.blockNumber = BigInt(await this.viemClient.getActualBlock());
    } catch (error) {
      loggerServer.fatal("Error SetActualBlock: ", error);
      this.blockNumber = BigInt(0);
    }
  }
  
  startFetchingLogs(callback: (logs: ParsedLog[]) => void) {
    this.viemClient.startListener((logs: Log[]) => {
      const logEntry = parseLogListener(logs);
      const finalParse = parseLogEntryToParsed(logEntry);
      callback(finalParse);
    });
  }
  
  async getBatchLogs(fromBlock: bigint, toBlock: bigint): Promise<LogEntry[]> {
    return this.viemClient.cliPublic.getLogs({
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
      
      const batchLogs = await this.getBatchLogs(fromBlock, toBlock);

      this.checkContractBorn(batchLogs);

      return parseLogEntryToParsed(batchLogs);

    } catch (error) {
      loggerServer.fatal("manageProcessRequest", error);
      throw error;
    }
  }
  async processSending(): Promise<boolean> {
    try {
      let isFetchingAfterNow = false;

      if (!this.isFetching) return true;

      loggerServer.trace("Analyze Data for day: ", loggingDate((this?.timeVolume || new Date())));

      const parsed = await this.manageProcessRequest(this.index, this.blockNumber);

      await this.sendLogsWithCheck(parsed, false, this.timeVolume);

      if (this.timeNow && this.timeVolume && !compareDates(this.timeNow, this.timeVolume)) isFetchingAfterNow = true;

      if (!this.timeNow) isFetchingAfterNow = true;

      if (isFetchingAfterNow) this.index++;

      if (this.timeVolume && isFetchingAfterNow) this.timeVolume = subtractOneDay(this.timeVolume);      

      if (this.isContractPrev !== BigInt(0)) return true;

      return false;
    } catch (error) {
      loggerServer.fatal("getEventsLogsFrom: ", error);
      throw error;
    }
  }

  async newFetching(): Promise<void> {
    try {
      this.timeVolume = removeTimeFromDate(new Date());

      await this.setActualBlock();

      loggerServer.info("new fetching with actual block: ", this.blockNumber.toString());

    } catch (error) {
      loggerServer.fatal("newFetching: ", error);
      this.timeVolume = removeTimeFromDate(new Date());
      this.blockNumber = BigInt(0);
      throw error;
    }
  }

  async getLogsFromHttp(): Promise<void> {
    try {
      await this.newFetching();

      while (this.isFetching) {
        const isStop = await this.processLogsBatch();
        await waiting(this.opt.waitingRequests);
        if (isStop) {
          loggerServer.warn("process fetching is stop -> smart contract is born");
          this.index = 0;
          loggerServer.debug("waiting for a new fetching...");
          this.timeNow = removeTimeFromDate(new Date());
          this.isContractPrev = BigInt(0);
          this.blockNumber = BigInt(0);
          await waiting(this.opt.waitingRequests);
          await this.newFetching();
        }
      }
    } catch (error) {
      loggerServer.fatal("getLogsFromHttp: ", error);
      this.isFetching = false;
      throw error;
    }
  };

  async processLogsBatch(): Promise<boolean> {
    const batchStartTime: number = Date.now();
    try {
      const isStop = await this.processSending();
      await waitingRate(batchStartTime, this.timePerRequest);
      return isStop;
    } catch (error) {
      loggerServer.error("processLogsBatch: ", error);
      throw error;
    }
  };

  ListeningEventLogs(): void {
    this.startFetchingLogs((logs: ParsedLog[]) => {
      loggerServer.trace("Receive logs: ", logs);
      if (logs) this.sendLogsWithCheck(logs, true, this.timeVolume);
    });
  }

  async init(): Promise<void> {
    try {
      this.ListeningEventLogs();
      await this.getLogsFromHttp();
    } catch (error) {
      loggerServer.fatal("Init Core: ", error);
      throw error;
    }
  }

  async sendVolume(volume: number, isUpdate: boolean, timeVolume: Date,timestamp: string): Promise<void> {

    if (isUpdate) {

      this.database.updateDataVolumes(timeVolume, volume);
      this.socket.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` });
    } else {
      this.socket.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` });
      return this.database.insertDataVolumes(`${timestamp}`, volume);
    }
  }

  calculateVolume(logs: ParsedLog[]): string {
    let volume = 0;
    for (const log of logs) {
      if (log.eventName === 'Transfer') {
        volume += log.value;
      }
    }
    return volume.toString();
  }

  async sendVolumeDaily(volume: number, timeVolume: Date | null): Promise<void> {    

    if (timeVolume) {
      const ts = removeTimeFromDate(timeVolume);
      const timestamp = ts.toISOString().split('T')[0];
      this.sendVolume(volume, false, timeVolume,timestamp);
    }
  }

  async sendData(parsed: ParsedLog[], volume: number, isRealTime: boolean, timeVolume:Date | null): Promise<void> {
    try {

      this.sendVolumeDaily(volume, timeVolume);

      for (const el of parsed) {
        await this.sendLog(el, isRealTime);
      }
    } catch (error) {
      loggerServer.fatal("sendData: ", error);
      throw error;
    }
  }

  async sendLogsWithCheck(parsed: ParsedLog[], isRealTime: boolean, timeVolume: Date | null): Promise<void> {
    try {
      if (!_.isEmpty(parsed)) {
        await this.sendData(parsed, Number(this.calculateVolume(parsed)), isRealTime, timeVolume);
      } else {
        loggerServer.warn("Log Empty");
      }
    } catch (error) {
      loggerServer.fatal("sendLogsWithCheck", error);
      throw error;
    }
  }

  async sendLog(data: ParsedLog, isRealTime: boolean): Promise<void> {
    try {
      await this.database.insertDataLogs(data);
      this.socket.sendingClient(data, isRealTime);
    } catch (error) {
      console.log(this.database.saveTx);
      loggerServer.fatal("SendLog",error);
      throw error;
    }
  }
}