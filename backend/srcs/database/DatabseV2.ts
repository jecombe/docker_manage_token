import { DataSource, getRepository } from 'typeorm';
import { ContractLog, ContractVolume } from './Entity';
import { loggerServer } from "../../utils/logger.js";
import { Opt, ParsedLog } from '../../utils/interfaces';
import _ from 'lodash';

export class DataBaseV2 {
  [x: string]: any;
  saveTx: string[];
  saveTime: string[];
  opt: Opt;
  constructor(opt: Opt) {
    this.opt = opt;
    this.saveTx = [];
    this.saveTime = [];
  }

  async resetFetching() {
    this.saveTime = [];
    this.saveTx = [];
  }



  async startBdd(): Promise<void> {

    try {
      this.AppDataSource = new DataSource(this.opt.databaseV2Config);
      await this.AppDataSource.initialize();

      loggerServer.info("Postgres is connected");
    } catch (error) {
      loggerServer.fatal("startBdd: ", error);
      throw error;
    }
  }

  async deleteAllData(): Promise<void> {
    try {
      loggerServer.warn('deleteAllData');
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      await contractLogRepository.clear();
      loggerServer.info('deleteAllData is ok');
    } catch (error) {
      loggerServer.error('Error deleting data:', error);
      throw error;
    }
  }

  async updateDataVolumes(timestamp: Date, volume: number): Promise<void> {
    try {
      loggerServer.trace('Data volumes update waiting...');
      const contractVolumeRepository = this.AppDataSource.getRepository(ContractVolume);
      const volumeRecord = await contractVolumeRepository.findOne({ where: { timestamp } });
      if (volumeRecord) {
        volumeRecord.volume = volume;
        await contractVolumeRepository.save(volumeRecord);
        loggerServer.info('Data volumes updated successfully');
      }
    } catch (error) {
      loggerServer.error('Error updating data volumes:', error);
      throw error;
    }
  }

  async deleteAllVolumes(): Promise<void> {
    try {
      loggerServer.warn('deleteAllVolumes');
      const contractVolumeRepository = this.AppDataSource.getRepository(ContractVolume);
      await contractVolumeRepository.clear();
      loggerServer.info('deleteAllVolumes is ok');
    } catch (error) {
      loggerServer.error('Error deleting data volumes:', error);
      throw error;
    }
  }

  async getAllDataFromAddr(fromAddress: string): Promise<ContractLog[]> {
    try {
      loggerServer.trace('getAllDataFromAddr:', fromAddress);
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      return await contractLogRepository.find({ where: { fromAddress } });
    } catch (error) {
      loggerServer.error('getAllDataFromAddr', error);
      throw error;
    }
  }

  async getData(): Promise<ContractLog[]> {
    try {
      loggerServer.trace('getData');
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      return await contractLogRepository.find();
    } catch (error) {
      loggerServer.error('getData:', error);
      throw error;
    }
  }

  async getAllTx(): Promise<ContractLog[]> {
    try {
      loggerServer.trace('getAllTx');
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      return await contractLogRepository.find({ where: { eventName: 'Transfer' } });
    } catch (error) {
      loggerServer.error('getAllTx:', error);
      throw error;
    }
  }

  async getTransfersFromAddress(fromAddress: string): Promise<ContractLog[]> {
    try {
      loggerServer.trace('getTransfersFromAddress:', fromAddress);
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      return await contractLogRepository.find({ where: { eventName: 'Transfer', fromAddress } });
    } catch (error) {
      loggerServer.fatal('getTransfersFromAddress:', error);
      throw error;
    }
  }

  async getAllowanceFromAddress(fromAddress: string): Promise<ContractLog[]> {
    try {
      loggerServer.trace('getAllowanceFromAddress:', fromAddress);
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      return await contractLogRepository.find({ where: { eventName: 'Approval', fromAddress } });
    } catch (error) {
      loggerServer.fatal('getAllowanceFromAddress:', error);
      throw error;
    }
  }

  async getAllAproval(): Promise<ContractLog[]> {
    try {
      loggerServer.trace('getAllAproval');
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      return await contractLogRepository.find({ where: { eventName: 'Approval' } });
    } catch (error) {
      loggerServer.error('getAllAproval:', error);
      throw error;
    }
  }

  async insertDataLogs(parsedLog: any): Promise<void> {
    try {
      loggerServer.trace('Data insert wating...');
      const contractLogRepository = this.AppDataSource.getRepository(ContractLog);
      const log = contractLogRepository.create(parsedLog);
      await contractLogRepository.save(log);
      loggerServer.info('Data inserted successfully');
    } catch (error) {
      loggerServer.error('Error inserting data:', error);
      throw error;
    }
  }

  async insertDataVolumes(timestamp: string, volume: number): Promise<void> {
    try {
      loggerServer.trace('Data volumes insert wating...');
      const contractVolumeRepository = this.AppDataSource.getRepository(ContractVolume);
      const volumeRecord = contractVolumeRepository.create({ timestamp, volume });
      await contractVolumeRepository.save(volumeRecord);
      loggerServer.info('Data volumes inserted successfully');
    } catch (error) {
      loggerServer.error('Error inserting data volumes:', error);
      throw error;
    }
  }

  async getAllVolumes(): Promise<ContractVolume[]> {
    try {
      loggerServer.trace('getAllVolumes');
      const contractVolumeRepository = this.AppDataSource.getRepository(ContractVolume);
      return await contractVolumeRepository.find();
    } catch (error) {
      loggerServer.error('getAllVolumes:', error);
      throw error;
    }
  }

  savedTx(array: ContractLog[]): void {
    array.forEach(el => {
      if (el.blockNumber !== undefined) {
        this.saveTx.push(el.transactionHash);
      }
    });
  }

  savingTx(parsed: ParsedLog[]) {
    parsed.forEach(el => {
      _.union(this.saveTx, el.transactionHash);
    });
  }

  savingTime(array: ContractVolume[]): void {
    array.forEach(el => {
      if (el.timestamp !== undefined) {
        this.saveTime.push(el.timestamp.toISOString());
      }
    });
  }

  async init(): Promise<void> {
    try {
      const readAll = await this.getData();
      this.savedTx(readAll);
      const allVolumes = await this.getAllVolumes();
      this.savingTime(allVolumes);
    } catch (error) {
      loggerServer.fatal("Init Database: ", error);
    }
  }
}
