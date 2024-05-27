
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import _ from "lodash";
import { isElementInArray, removeTimeFromDate } from "../../utils/utils.js";
import { ParsedLog } from "../../utils/interfaces.js";
import { Socket } from "../server/Socket.js";
import { DataBase } from "../database/DataBase.js";

dotenv.config();

export class Sender {
  database: DataBase;
  socket: Socket;

  constructor(database: DataBase, socket: Socket) {
    this.database = database;
    this.socket = socket;
  }

  async sendVolume(volume: number, isUpdate: boolean, timeVolume: Date,timestamp: string): Promise<void> {

    if (isUpdate) {
      this.database.saveTime.push(timestamp);

      this.database.updateDataVolumes(timeVolume, volume);
      this.socket.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` });
    } else {
      this.socket.sendWsVolumeToAllClients({ timestamp, volume: `${volume}` });
      return this.database.insertDataVolumes(timestamp, volume);
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

  async sendVolumeDaily(volume: number, timeVolume: Date | null): Promise<void> {

    if (timeVolume && !isElementInArray(this.database.saveTime, timeVolume)) {
      const ts = removeTimeFromDate(timeVolume);
      const timestamp = ts.toISOString().split('T')[0];

      this.sendVolume(volume, false, timeVolume,timestamp);
    } else {
      loggerServer.warn("is Exist", volume);

      if (timeVolume && volume) {
        const ts = removeTimeFromDate(timeVolume);
        const timestamp = ts.toISOString().split('T')[0];
        this.sendVolume(volume, true, timeVolume,timestamp);
      }
    }
  }

  async sendData(parsed: ParsedLog[], volume: number, isRealTime: boolean, timeVolume:Date | null): Promise<void> {
    try {

      this.sendVolumeDaily(volume, timeVolume);

      for (const el of parsed) {
        if (!_.includes(this.database.saveTx, el.transactionHash)) {
          loggerServer.trace("Adding new thing", el);
          await this.sendLog(el, isRealTime);
        }

      }
    } catch (error) {
      loggerServer.fatal("sendData: ", error);
      throw error;
    }
  }

  async sendLogsWithCheck(parsed: ParsedLog[], isRealTime: boolean, timeVolume: Date | null): Promise<void> {
    try {
      if (!_.isEmpty(parsed)) {
        const checkExisting: ParsedLog[] = this.isExist(parsed);
        if (!_.isEmpty(checkExisting)) {

          await this.sendData(checkExisting, Number(this.calculateVolume(checkExisting)), isRealTime, timeVolume);
        } else {
          loggerServer.warn("Log already existe", parsed);
        }
      }
    } catch (error) {
      loggerServer.fatal("sendLogsWithCheck", error);
      throw error;
    }
  }

  getSocketIds(addressTo: string, addressFrom: string){
    const socketIdTo = this.socket?.managerUser.getSocketId(addressTo); 
    const socketIdFrom = this.socket.managerUser.getSocketId(addressFrom);

    return {socketIdTo, socketIdFrom};
  }

  async sendLog(data: ParsedLog, isRealTime: boolean): Promise<void> {
    try {
      await this.database.insertDataLogs(data);

      const { socketIdTo, socketIdFrom } = this.getSocketIds(data.to,data.from);
        
      if (socketIdTo && isRealTime) this.socket.sendDataToClientWithAddress(`${socketIdTo}` , data);
      if (socketIdFrom && isRealTime) this.socket.sendDataToClientWithAddress(`${socketIdFrom}` , data);

      if (socketIdTo) this.socket.sendWsToClient(`${socketIdTo}` , data);
      if (socketIdFrom) this.socket.sendWsToClient(`${socketIdFrom}` , data);

      this.socket.sendWsToAllClients(data);

      this.database.saveTx.push(data.transactionHash);

    } catch (error) {
      console.log(this.database.saveTx);
      loggerServer.fatal("SendLog",error);
      throw error;

    }
  }
}