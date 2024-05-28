
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import { DataBase } from "../database/DataBase.js";
import { Core } from "../core/Core.js";
import { Request, Response, Express } from 'express';
import { DataBaseV2 } from "../database/DatabseV2.js";

dotenv.config();

export class Api{

  private app: Express;
  private database: DataBaseV2;
  private core: Core;

  constructor(app: Express, database: DataBaseV2, core: Core) {
    this.app = app;
    this.database = database;
    this.core = core;
    this.getApi();
  }


  getAllVolumesDaily(): void {
    this.app.get("/api/get-all-volumes", async (req:Request, res: Response) => {
      try {
        loggerServer.trace(`get-all-volumes - Receive request from: ${req.ip}`);
        res.json(await this.database.getAllVolumes());
      } catch (error) {
        loggerServer.fatal(`get-all-volumes: ${req.ip}`, error);
        res.status(500).send("Error intern server get all volumes");
      }
    });
  }

  deleteDatabase(): void {
    this.app.delete("/api/delete-database", async (req:Request, res: Response) => {
      try {
        loggerServer.trace(`delete-database - Receive request from: ${req.ip}`);
        this.core.resetFetching();

        await this.database.deleteAllData();
        await this.database.deleteAllVolumes();

        setTimeout(async () => {
          this.core.startAfterReset();
        }, 10000);

        res.json("delete database ok");
      } catch (error) {
        loggerServer.fatal(`delete-database: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getAllData(): void {
    this.app.get("/api/get-all", async (req: Request, res: Response) => {
      try {
        loggerServer.trace(`get-all - Receive request from: ${req.ip}`);
        res.json(await this.database.getData());
      } catch (error) {
        loggerServer.fatal(`get-all: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getAllLogsFromAddr(): void {
    this.app.get("/api/get-all-addr", async (req:Request, res: Response) => {
      try {
        loggerServer.trace(`get-all-addr - Receive request from: ${req.ip}`);

        res.json(await this.database.getAllDataFromAddr(`${req.query.userAddress}`));
      } catch (error) {
        loggerServer.fatal(`get-all-addr: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getTransactions(): void {
    this.app.get("/api/get-all-transac", async (req:Request, res: Response) => {
      try {
        loggerServer.trace(`get-all-transac - Receive request from: ${req.ip}`);
        res.json(await this.database.getAllTx());
      } catch (error) {
        loggerServer.fatal(`get-all-transac: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getTransactionsFromAddr(): void {
    this.app.get("/api/get-all-transac-addr", async (req:Request, res: Response) => {
      try {
        loggerServer.trace(`get-all-transac-addr - Receive request from: ${req.ip}`);
        res.json(await this.database.getTransfersFromAddress(`${req.query.userAddress}`));
      } catch (error) {
        loggerServer.fatal(`get-all-transac-addr: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }


  getAllowances(): void {
    this.app.get("/api/get-all-allowances", async (req:Request, res: Response) => {
      try {
        loggerServer.trace(`get-all-allowances - Receive request from: ${req.ip}`);
        res.json(await this.database.getAllAproval());
      } catch (error) {
        loggerServer.fatal(`get-all-transac: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getAllowancesFromAddr(): void {
    this.app.get("/api/get-all-allowances-addr", async (req:Request, res: Response) => {
      try {
        loggerServer.trace(`get-all-allowances-addr - Receive request from`, req.ip);
        res.json(await this.database.getAllowanceFromAddress(`${req.query.userAddress}`));
      } catch (error) {
        loggerServer.fatal(`get-all-allowances-addr: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getApi() {
    this.deleteDatabase();
    this.getAllData();
    this.getAllLogsFromAddr();
    this.getTransactions();
    this.getTransactionsFromAddr();
    this.getAllowances();
    this.getAllowancesFromAddr();
    this.getAllVolumesDaily();

    loggerServer.info("Api is started");
  }
}