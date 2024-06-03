import { DataBaseV2 } from "./srcs/database/DatabaseV2.js";
import { ContractLog, ContractVolume } from "./srcs/database/Entity.js";
import { ServerV2 } from "./srcs/server/ServerV2.js";
import { Opt } from "./utils/interfaces.js";
import { loggerServer } from "./utils/logger.js";
import { Api } from "./srcs/server/Api.js";
import { EventSync } from "./srcs/core/EventSync.js";
import { ViemClient } from "./srcs/contract/ViemClient.js";
import { Parser } from "./srcs/Format.js";
import { UserManager } from "./srcs/users/Users.js";
import { SocketClient } from "./srcs/server/Socket.js";




const print = () => {
  loggerServer.info("============= Starting application manager token =============");
  loggerServer.trace(`
      ██████╗ ██╗   ██╗███████╗██████╗ 
      ██╔══██╗██║   ██║██╔════╝██╔══██╗
      ██████╔╝██║   ██║███████╗██║  ██║
      ██╔══██╗██║   ██║╚════██║██║  ██║
      ██████╔╝╚██████╔╝███████║██████╔╝
      ╚═════╝  ╚═════╝ ╚══════╝╚═════╝                   
      `);
};


const opt: Opt = {
  waitingRequests: 3000,
  wsUrl: "wss://sepolia.infura.io/ws/v3/3576824e640441d38580334356ef5046",
  busdContract: `${process.env.CONTRACT}`,
  viemConfig: {
    reconnect: {
      // maxAttempts:
      delay: 2000, // Delay between reconnection attempts (in ms)
    },
    retryCount: 3, // Maximum number of retries for failed requests
    retryDelay: 150, // Base delay between retry attempts (in ms)
    timeout: 10000, // Timeout for async WebSocket requests (in ms)
  },
  databaseConfig: {
    user: `${process.env.USR}`,
    password: `${process.env.PASSWORD}`,
    host: `${process.env.HOST}`,
    database: `${process.env.DB}`
  },
  databaseV2Config: {
    type: "postgres",
    username: `${process.env.USR}`,
    password: `${process.env.PASSWORD}`,
    host: `${process.env.HOST}`,
    database: `${process.env.DB}`,
    entities: [ContractLog, ContractVolume],
    synchronize: true,
    logging: false,
  }
};

(async () => {
  try {
    const parser = new Parser();
    const user = new UserManager();
    const viemClient = new ViemClient(opt);
    const database = new DataBaseV2(opt);
    const server = new ServerV2();
    const socket = new SocketClient(server, parser, user);
    const core = new EventSync(viemClient, opt, database, socket, parser);
    new Api(server.app, database, core);
    print();
    await database.startBdd();

    //if (isCleaning) await this.clean();

    await server.init();

    core.init();

  } catch (error) {
    console.log(error);
  }
})();


/*
async clean() {
await this.database.deleteAllData();
await this.database.deleteAllVolumes();
}
*/
