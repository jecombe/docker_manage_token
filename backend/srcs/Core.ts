
import dotenv from "dotenv";
import { loggerServer } from "../utils/logger.js";
import _ from "lodash";
import { compareDates, getRateLimits, isElementInArray, loggingDate, removeTimeFromDate, subtractOneDay, waiting, waitingRate } from "../utils/utils.js";
import { User, ParsedLog } from "../utils/interfaces.js";
import { ServerV2 } from "./server/ServerV2.js";
import { ContractV2 } from "./contract/ContractV2.js";
import { Socket } from "./server/Socket.js";
import { DataBase } from "./database/DataBase.js";
import { UserManager } from "./Users.js";

dotenv.config();

export class Core {
  index: number;
  server: ServerV2;
  contract: ContractV2;
  timePerRequest: number;
  isFetching: boolean;
  timeVolume: Date | null;
  saveBatch: Date | null;
  userManager: UserManager;
  database: DataBase;
  socket: Socket | null;


  constructor(contract: ContractV2, server: ServerV2, database: DataBase, socket: Socket | null) {
    this.timeVolume = null;
    this.database = database;
    this.server = server;
    this.socket = socket;
    this.userManager = new UserManager();
    this.contract = contract;
    this.saveBatch = null;
    this.index = 0;
    this.isFetching = true;
    this.timePerRequest = getRateLimits();
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
    this.isFetching = false;
    this.index = 0;
    this.saveBatch = null;
    this.database.resetFetching();
  }

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  async sendVolumeDaily(volume: number): Promise<void> {

    if (this.timeVolume && !isElementInArray(this.database.saveTime, this.timeVolume)) {
      const ts = removeTimeFromDate(this.timeVolume);
      const timestamp = ts.toISOString().split('T')[0];
      this.database.saveTime.push(timestamp);

      this.socket?.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` });

      return this.database.insertDataVolumes(timestamp, volume);
    } else {
      loggerServer.warn("is Exist", volume);

      if (this.timeVolume && volume) {
        const ts = removeTimeFromDate(this.timeVolume);
        const timestamp = ts.toISOString().split('T')[0];
        this.database.updateDataVolumes(this.timeVolume, volume);
        this.socket?.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` });

      }
    }
  }

  async sendData(parsed: ParsedLog[], volume: number, isRealTime: boolean): Promise<void> {
    try {

      this.sendVolumeDaily(volume);

      for (const el of parsed) {
        if (!_.includes(this.database.saveTx, el.transactionHash)) {
          await this.database.insertDataLogs(el);

          const socketIdTo = this.userManager.getSocketId(el.to); 
          const socketIdFrom = this.userManager.getSocketId(el.from);
          
          if (socketIdTo && isRealTime) this.socket?.sendDataToClientWithAddress(`${socketIdTo}` , el);
          if (socketIdFrom && isRealTime) this.socket?.sendDataToClientWithAddress(`${socketIdFrom}` , el);

          if (socketIdTo) this.socket?.sendWsToClient(`${socketIdTo}` , el);
          if (socketIdFrom) this.socket?.sendWsToClient(`${socketIdFrom}` , el);

          this.socket?.sendWsToAllClients(el);

          this.database.saveTx.push(el.transactionHash);
        }
      }
    } catch (error) {
      loggerServer.fatal("sendData: ", error);
      throw error;
    }
  }

  isExist(array: ParsedLog[]): ParsedLog[] {
    return array.reduce((acc: ParsedLog[], el: ParsedLog) => {
      if (!_.includes(this.database.saveTx, el.transactionHash)) {
        acc.push(el);
      }
      return acc;
    }, []);
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


  async sendLogsWithCheck(parsed: ParsedLog[], isRealTime: boolean): Promise<void> {
    try {
      if (!_.isEmpty(parsed)) {
        const checkExisting: ParsedLog[] = this.isExist(parsed);
        if (!_.isEmpty(checkExisting)) {

          loggerServer.trace("Adding new thing");          
          await this.sendData(checkExisting, Number(this.calculateVolume(checkExisting)), isRealTime);
        } else {
          loggerServer.error("Log already existe", parsed);
        }

      }
    } catch (error) {
      loggerServer.fatal("sendLogsWithCheck", error);
      throw error;
    }
  }


  async getEventsLogsFrom(): Promise<boolean> {
    try {
      let isFetchingAfterNow = false;

      this.contract.isContractPrev = BigInt(0);

      if (!this.isFetching) return true;

      loggerServer.trace("Analyze Data for day: ", loggingDate((this?.timeVolume || new Date())));

      const parsed = await this.contract.manageProcessRequest(this.index, this.contract.blockNumber);

      await this.sendLogsWithCheck(parsed, false);

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

      this.contract.blockNumber = BigInt(await this.contract.getActualBlock());
      loggerServer.info("new fetching with actual block: ", this.contract.blockNumber.toString());

    } catch (error) {
      loggerServer.fatal("newFetching: ", error);
      this.timeVolume = removeTimeFromDate(new Date());
      this.contract.blockNumber = BigInt(0);
      throw error;
    }
  }

  async getLogsContract(): Promise<void> {
    try {
      await this.newFetching();

      while (this.isFetching) {
        const isStop = await this.processLogsBatch();
        await waiting(6000);
        if (isStop) {
          loggerServer.warn("process fetching is stop -> smart contract is born");
          this.index = 0;
          loggerServer.info("waiting for a new fetching...");
          this.saveBatch = removeTimeFromDate(new Date());

          await waiting(6000);
          await this.newFetching();
        }
      }
    } catch (error) {
      loggerServer.fatal("getLogsContract: ", error);
      this.isFetching = false;
      throw error;
    }
  };

  async processLogsBatch(): Promise<boolean> {
    const batchStartTime: number = Date.now();
    try {
      const isStop = await this.getEventsLogsFrom();
      await waitingRate(batchStartTime, this.timePerRequest);
      return isStop;
    } catch (error) {
      loggerServer.error("processLogsBatch: ", error);
      throw error;
    }
  };

  startWyEvents(): void {
    this.contract.startFetchingLogs((logs: ParsedLog[]) => {
      loggerServer.trace("Receive logs: ", logs);
      if (logs) this.sendLogsWithCheck(logs, true);
    });
  }

  async init(): Promise<void> {
    try {
      this.startWyEvents();
      await this.getLogsContract();
    } catch (error) {
      loggerServer.fatal("Init Core: ", error);
      throw error;
    }
  }
}