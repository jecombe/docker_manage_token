
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import { compareDates, getRateLimits, loggingDate, removeTimeFromDate, subtractOneDay, waiting, waitingRate } from "../../utils/utils.js";
import { Opt, ParsedLog } from "../../utils/interfaces.js";
import { ContractV2 } from "../contract/ContractV2.js";
import { Sender } from "./Sender.js";

dotenv.config();

export class Core {
  index: number;
  contract: ContractV2;
  timePerRequest: number;
  isFetching: boolean;
  timeVolume: Date | null;
  saveBatch: Date | null;
  sender: Sender;
  opt: Opt;

  constructor(contract: ContractV2, opt: Opt, sender:Sender) {
    this.opt = opt;
    this.timeVolume = null;
    this.sender = sender;
    this.contract = contract;
    this.saveBatch = null;
    this.index = 0;
    this.isFetching = true;
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
    this.saveBatch = null;
    //this.sender.database.resetFetching();
  }

  async processSending(): Promise<boolean> {
    try {
      let isFetchingAfterNow = false;

      if (!this.isFetching) return true;

      loggerServer.trace("Analyze Data for day: ", loggingDate((this?.timeVolume || new Date())));

      const parsed = await this.contract.manageProcessRequest(this.index, this.contract.blockNumber);

      await this.sender.sendLogsWithCheck(parsed, false, this.timeVolume);

      if (this.saveBatch && this.timeVolume && !compareDates(this.saveBatch, this.timeVolume)) isFetchingAfterNow = true;

      if (!this.saveBatch) isFetchingAfterNow = true;

      if (isFetchingAfterNow) this.index++;

      if (this.timeVolume && isFetchingAfterNow) this.timeVolume = subtractOneDay(this.timeVolume);      

      if (this.contract.isContractPrev !== BigInt(0)) return true;

      return false;
    } catch (error) {
      loggerServer.fatal("getEventsLogsFrom: ", error);
      throw error;
    }
  }

  async newFetching(): Promise<void> {
    try {
      this.timeVolume = removeTimeFromDate(new Date());

      await this.contract.setActualBlock();

      loggerServer.info("new fetching with actual block: ", this.contract.blockNumber.toString());

    } catch (error) {
      loggerServer.fatal("newFetching: ", error);
      this.timeVolume = removeTimeFromDate(new Date());
      this.contract.blockNumber = BigInt(0);
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
          loggerServer.info("waiting for a new fetching...");
          this.saveBatch = removeTimeFromDate(new Date());
          this.contract.isContractPrev = BigInt(0);
          this.contract.blockNumber = BigInt(0);
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
    this.contract.startFetchingLogs((logs: ParsedLog[]) => {
      loggerServer.trace("Receive logs: ", logs);
      if (logs) this.sender.sendLogsWithCheck(logs, true, this.timeVolume);
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
}