import { loggerServer } from "../utils/logger";
import dotenv from "dotenv";
import { Server } from "./Server";
import { Config } from "../utils/interfaces";

interface User {
  socketId: string;
  address: string;
}

dotenv.config();

export class Manager extends Server {
  config: Config;
  users: { [address: string]: User };

  constructor(config: Config) {
    super();
    this.config = config;
    this.setManager(this);
    this.users = {};
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

  addUsers(socketId: string, address: string) {
    if (address in this.users) {
      if (this.users[address].socketId !== socketId) {
        this.users[address].socketId = socketId;
        this.users[address].address = address;

      }
    } else {
      this.users[address] = { socketId, address };
    }
  }

  removeUser(address: string) {
    if (address in this.users) {
      delete this.users[address];
      // console.log(`User with address ${address} has been removed.`);
    } else {
      // console.log(`User with address ${address} does not exist.`);
    }
  }
}
