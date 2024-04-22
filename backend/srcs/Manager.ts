import { loggerServer } from "../utils/logger";
import dotenv from "dotenv";
import { Server } from "./Server";
import { Config } from "../utils/interfaces";

dotenv.config();

export class Manager extends Server {
  config: Config;
    
  constructor(config: Config) {
    super();
    this.config = config;
    this.setManager(this);
  }

  async startServer(): Promise<void> {
    try {
      loggerServer.info("============= Starting application manager token =============");
      loggerServer.trace(`

            
            ██████╗ ██╗   ██╗███████╗██████╗ 
            ██╔══██╗██║   ██║██╔════╝██╔══██╗
            ██████╔╝██║   ██║███████╗██║  ██║
            ██╔══██╗██║   ██║╚════██║██║  ██║
            ██████╔╝╚██████╔╝███████║██████╔╝
            ╚═════╝  ╚═════╝ ╚══════╝╚═════╝ 
                                             
            `);

      await this.start();
    } catch (error) {
      loggerServer.fatal("StartServer: ", error);
    }
  }

}
