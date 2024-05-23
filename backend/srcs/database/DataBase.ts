
import dotenv from "dotenv";
import { Pool, QueryResult } from 'pg';
import { loggerServer } from "../../utils/logger.js";
import { ParsedLog, Query, ResultBdd, ResultVolume } from "../../utils/interfaces.js";
import _ from "lodash";

dotenv.config();

export class DataBase {

  pool: Pool;
  saveTx: string[];
  saveTime: string[];

  constructor() {
    this.pool = new Pool({
      user: process.env.USR,
      password: process.env.PASSWORD,
      host: process.env.HOST,
      database: process.env.DB
    });
    this.saveTx = [];
    this.saveTime = [];

  }

  async resetFetching() {
    this.saveTime = [];
    this.saveTx = [];
  }


  async deleteAllData(): Promise<void> {
    const query = {
      text: 'DELETE FROM contract_logs',
    };
    try {
      loggerServer.warn('deleteAllData');
      await this.pool.query(query);
      loggerServer.info('deleteAllData is ok');

    } catch (error) {
      loggerServer.error('Error deleting data:', error);
      throw error;
    }
  }

  async updateDataVolumes(timestamp: Date, volume: number): Promise<void> {
    const query: Query = {
      text: 'UPDATE contract_volumes SET volume = $1 WHERE timestamp = $2',
      values: [volume, timestamp],
    };
    try {
      loggerServer.trace('Data volumes update waiting...');
      await this.pool.query(query);
      loggerServer.info('Data volumes updated successfully');
    } catch (error) {
      loggerServer.error('Error updating data volumes:', error);
      throw error;
    }
  }

  async deleteAllVolumes(): Promise<void> {
    const query = {
      text: 'DELETE FROM contract_volumes',
    };
    try {
      loggerServer.warn('deleteAllVolumes');
      await this.pool.query(query);
      loggerServer.info('deleteAllVolumes is ok');

    } catch (error) {
      loggerServer.error('Error deleting data volumes:', error);
      throw error;
    }
  }

  async getAllDataFromAddr(fromAddress: string): Promise<ResultBdd[]> {
    const query: Query = {
      text: "SELECT * FROM contract_logs WHERE fromAddress = $1",
      values: [fromAddress],
    };
    try {
      loggerServer.trace('getAllDataFromAddr:', fromAddress);
      const result: QueryResult = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      loggerServer.error('getAllDataFromAddr', error);
      throw error;
    }
  }

  async getData(): Promise<ResultBdd[]> {
    const query: Query = {
      text: 'SELECT * FROM contract_logs',
    };
    try {
      loggerServer.trace('getData');
      const result: QueryResult = await this.pool.query(query);
            
      return result.rows;
    } catch (error) {
      loggerServer.error('getData:', error);
      throw error;
    }
  }

  async getAllTx(): Promise<ResultBdd[]> {
    const query: Query = {
      text: "SELECT * FROM contract_logs WHERE eventName='Transfer'"
    };
    try {
      loggerServer.trace('getAllTx');
      const result: QueryResult = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      loggerServer.error('getAllTx:', error);
      throw error;
    }
  }

  async getTransfersFromAddress(fromAddress: string): Promise<ResultBdd[]> {
    const query: Query = {
      text: "SELECT * FROM contract_logs WHERE eventName = 'Transfer' AND fromAddress = $1",
      values: [fromAddress],
    };
    try {
      loggerServer.trace('getTransfersFromAddress:', fromAddress);
      const result: QueryResult = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      loggerServer.fatal('getTransfersFromAddress:', error);
      throw error;
    }
  }

  async getAllowanceFromAddress(fromAddress: string): Promise<ResultBdd[]> {
    const query: Query = {
      text: "SELECT * FROM contract_logs WHERE eventName = 'Approval' AND fromAddress = $1",
      values: [fromAddress],
    };
    try {
      loggerServer.trace('getAllowanceFromAddress:', fromAddress);
      const result: QueryResult = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      loggerServer.fatal('getAllowanceFromAddress:', error);
      throw error;
    }
  }

  async getAllAproval(): Promise<ResultBdd[]> {
    const query: Query = {
      text: "SELECT * FROM contract_logs WHERE eventName='Approval'"
    };
    try {
      loggerServer.trace('getAllAproval');
      const result: QueryResult = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      loggerServer.error('getAllAproval:', error);
      throw error;
    }
  }

  async getVolumneByDate(parsedLog: ParsedLog): Promise<void> {
    const query: Query = {
      text: 'INSERT INTO contract_logs (transactionHash, blockNumber, eventName, fromAddress, toAddress, value) VALUES ($1, $2, $3, $4, $5, $6)',
      values: [parsedLog.transactionHash, parsedLog.blockNumber, parsedLog.eventName, parsedLog.from, parsedLog.to, parsedLog.value],
    };
    try {
      loggerServer.trace('Data insert wating...');
      await this.pool.query(query);
      loggerServer.info('Data inserted successfully');
    } catch (error) {
      loggerServer.error('Error inserting data:', error);
      throw error;
    }
  }

  async insertDataLogs(parsedLog: ParsedLog): Promise<void> {
    const query: Query = {
      text: 'INSERT INTO contract_logs (transactionHash, blockNumber, eventName, fromAddress, toAddress, value) VALUES ($1, $2, $3, $4, $5, $6)',
      values: [parsedLog.transactionHash, parsedLog.blockNumber, parsedLog.eventName, parsedLog.from, parsedLog.to, parsedLog.value],
    };
    try {
      loggerServer.trace('Data insert wating...');
      await this.pool.query(query);
      loggerServer.info('Data inserted successfully');
    } catch (error) {
      loggerServer.error('Error inserting data:', error);
      throw error;
    }
  }

  async insertDataVolumes(timestamp: string, volume: number): Promise<void> {
    const query: Query = {
      text: 'INSERT INTO contract_volumes (timestamp, volume) VALUES ($1, $2)',
      values: [timestamp, volume],
    };
    try {
      loggerServer.trace('Data volumes insert wating...');
      await this.pool.query(query);
      loggerServer.info('Data volumes inserted successfully');
    } catch (error) {
      loggerServer.error('Error inserting data volumes:', error);
      throw error;
    }
  }

  async getAllVolumes(): Promise<ResultVolume[]> {
    const query: Query = {
      text: "SELECT * FROM contract_volumes"
    };
    try {
      loggerServer.trace('getAllVolumes');
      const result: QueryResult = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      loggerServer.error('getAllAproval:', error);
      throw error;
    }
  }

  async startBdd(): Promise<void> {
    try {
      await this.pool.connect();
      loggerServer.info("Postgres is connected");
    } catch (error) {
      loggerServer.fatal("startBdd: ", error);
      throw error;
    }
  }
  

  savedTx(array: ResultBdd[]): void {
    array.map((el: ResultBdd) => {
      if (el.blocknumber !== undefined) {
        this.saveTx.push(el.transactionhash);
      }
    });
  }


  savingTx(parsed: ParsedLog[]) {
    parsed.map((el: ParsedLog) => {
      _.union(this.saveTx, el.transactionHash);
    });
  }


  savingTime(array: ResultVolume[]): void {
    array.map((el: ResultVolume) => {
      if (el.timestamp !== undefined) {
        this.saveTime.push(el.timestamp);
      }
    });
  }


  async init(): Promise<void> {
    try {
      const readAll: ResultBdd[] = await this.getData();
      this.savedTx(readAll);
      const allVolumes: ResultVolume[] = await this.getAllVolumes();
      this.savingTime(allVolumes);
    } catch (error) {
      loggerServer.fatal("Init Database: ", error);
      
    } 
  }
}