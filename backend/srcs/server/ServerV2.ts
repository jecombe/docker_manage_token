
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import express, { Express } from 'express';
import cors from "cors";
import http, { Server } from 'http';

dotenv.config();

const PORT = process.env.PORT_SERVER;

export class ServerV2 {
  public app: Express;
  public server: Server;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
  }

  async init(): Promise<void> {
    const corsOptions: cors.CorsOptions = {
      origin: "*",
      optionsSuccessStatus: 200,
    };
    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));

    return new Promise<void>((resolve, reject) => {
      this.server.listen(PORT, () => {
        loggerServer.info(`Server is listening on port ${PORT}`);
        resolve();
      }).on('error', (err: Error) => {
        reject(err);
      });
    });
  }
}