import { Api } from "./../server/Api.js";
import { ContractV2 } from "./../contract/ContractV2.js";
import { Core } from "./../core/Core.js";
import { DataBase } from "./../database/DataBase.js";
import { ServerV2 } from "./../server/ServerV2.js";
import { Socket } from "./../server/Socket.js";
import { Sender } from "./../core/Sender.js";
import { loggerServer } from "../../utils/logger.js";

export class Analyze {
  public database: DataBase; 
  public contract: ContractV2;
  public server: ServerV2;
  public core: Core;
  public socket: Socket;
  isInit: boolean;
  
  
  constructor() {
    this.contract = new ContractV2();
    this.database = new DataBase();
    this.server = new ServerV2();
    this.socket = new Socket(this.server);
    this.core = new Core(this.contract, new Sender(this.database, this.socket));
    new Api(this.server.app, this.database, this.core);
    this.isInit = false;
  }
  
  async clean() {
    await this.database.deleteAllData();
    await this.database.deleteAllVolumes();
  }
  
  print() {
    loggerServer.info("============= Starting application manager token =============");
    loggerServer.trace(`

          
          ██████╗ ██╗   ██╗███████╗██████╗ 
          ██╔══██╗██║   ██║██╔════╝██╔══██╗
          ██████╔╝██║   ██║███████╗██║  ██║
          ██╔══██╗██║   ██║╚════██║██║  ██║
          ██████╔╝╚██████╔╝███████║██████╔╝
          ╚═════╝  ╚═════╝ ╚══════╝╚═════╝ 
                                           
          `);
  }
  
  async init() {
    try {
      this.print();
      await this.database.startBdd();
      await this.clean();
      await this.database.init();
      await this.server.init();
      this.isInit = true;
    } catch (error) {
      this.isInit = false;
      loggerServer.fatal("Init Analyze: ", error);
      throw error;
    }
  }
  
  async startApp() {
    try {
      if (this.isInit) this.core.init();
      else throw ("Before start app you need to call init function of Analyze");
    } catch (error) {
      loggerServer.fatal("startApp: ", error);
      throw error;
    }
  }
}