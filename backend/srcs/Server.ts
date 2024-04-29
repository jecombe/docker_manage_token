
import dotenv from "dotenv";
import { loggerServer } from "../utils/logger.js";

import { DataBase } from "./DataBase.js";

import express from "express";
import cors from "cors";
import { Manager } from "./Manager.js";
import { Contract } from "./Contract.js";
import { Log } from "viem";
import { LogEntry, ResultBdd, ResultVolume } from "../utils/interfaces.js";
import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";

dotenv.config();

const app = express();
const port = process.env.PORT_SERVER;
const server = http.createServer(app);


export class Server extends DataBase {

  public contract: Contract | null;
  private io: SocketIOServer;


  constructor() {
    super();
    this.contract = null;
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
  }

  startWebSocketServer(): void {
    loggerServer.info("Start websocket")
    this.io.on("connection", (socket: Socket) => {
      console.log("Client connected");

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }

  setManager(manager: Manager): void {
    this.contract = new Contract(manager);
  }

  startApp(): void {
    const corsOptions: cors.CorsOptions = {
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.listen(port, () => {
      loggerServer.info(`Server is listening on port ${port}`);
    });

  }

  getAllData(): void {
    app.get("/api/get-all", async (req, res) => {
      try {
        loggerServer.trace(`get-all - Receive request from: ${req.ip}`);
        res.json(await this.getData());
      } catch (error) {
        loggerServer.fatal(`get-all: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getAllVolumesDaily(): void {
    app.get("/api/get-all-volumes", async (req, res) => {
      try {
        loggerServer.trace(`get-all-volumes - Receive request from: ${req.ip}`);
        res.json(await this.getAllVolumes());
      } catch (error) {
        loggerServer.fatal(`get-all-volumes: ${req.ip}`, error);
        res.status(500).send("Error intern server get all volumes");
      }
    });
  }

  deleteDatabase(): void {
    app.delete("/api/delete-database", async (req, res) => {
      try {
        loggerServer.trace(`delete-database - Receive request from: ${req.ip}`);
        this.contract?.resetFetching();

        await this.deleteAllData();
        await this.deleteAllVolumes();

        setTimeout(async () => {
          this.contract?.startAfterReset();
        }, 10000);

        res.json("delete database ok");
      } catch (error) {
        loggerServer.fatal(`delete-database: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }



  getAllLogsFromAddr(): void {
    app.get("/api/get-all-addr", async (req, res) => {
      try {
        loggerServer.trace(`get-all-addr - Receive request from: ${req.ip}`);

        res.json(await this.getAllDataFromAddr(`${req.query.userAddress}`));
      } catch (error) {
        loggerServer.fatal(`get-all-addr: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getTransactions(): void {
    app.get("/api/get-all-transac", async (req, res) => {
      try {
        loggerServer.trace(`get-all-transac - Receive request from: ${req.ip}`);
        res.json(await this.getAllTx());
      } catch (error) {
        loggerServer.fatal(`get-all-transac: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getTransactionsFromAddr(): void {
    app.get("/api/get-all-transac-addr", async (req, res) => {
      try {
        loggerServer.trace(`get-all-transac-addr - Receive request from: ${req.ip}`);
        res.json(await this.getTransfersFromAddress(`${req.query.userAddress}`));
      } catch (error) {
        loggerServer.fatal(`get-all-transac-addr: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }


  getAllowances(): void {
    app.get("/api/get-all-allowances", async (req, res) => {
      try {
        loggerServer.trace(`get-all-allowances - Receive request from: ${req.ip}`);
        res.json(await this.getAllAproval());
      } catch (error) {
        loggerServer.fatal(`get-all-transac: ${req.ip}`, error);

        res.status(500).send("Error intern server delete");
      }
    });
  }

  getAllowancesFromAddr(): void {
    app.get("/api/get-all-allowances-addr", async (req, res) => {
      try {
        loggerServer.trace(`get-all-allowances-addr - Receive request from`, req.ip);
        res.json(await this.getAllowanceFromAddress(`${req.query.userAddress}`));
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

  saveTx(array: ResultBdd[]): void {
    array.map((el: ResultBdd) => {
      if (el.blocknumber !== undefined && this.contract) {
        this.contract.saveTx.push(el.transactionhash);
      }
    });
  }


  saveTime(array: ResultVolume[]): void {
    array.map((el: ResultVolume) => {
      if (el.timestamp !== undefined && this.contract) {
        this.contract.saveTime.push(el.timestamp);
      }
    });
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


  startFetchingLogs(): void {
    this.contract?.startListener((logs: Log[]) => {
      loggerServer.trace("Receive logs: ", logs);
      const finalParse = this.contract?.parseResult(this.parseLogListener(logs))

      if (finalParse) this.contract?.sendLogsWithCheck(finalParse);
    });
  }

  async start(): Promise<void> {
    try {
      this.startApp();
      this.getApi();
      await this.startBdd();
      const readAll: ResultBdd[] = await this.getData();
      this.saveTx(readAll);
      const allVolumes: ResultVolume[] = await this.getAllVolumes();
      this.saveTime(allVolumes);
      this.startWebSocketServer();
      this.startFetchingLogs();
      this.contract?.startListeningEvents();
    } catch (error) {
      loggerServer.error("start", error);
      throw error;
    }
  }
}


