import { Api } from "./srcs/server/Api.js";
import { ContractV2 } from "./srcs/contract/ContractV2.js";
import { Core } from "./srcs/Core.js";
import { DataBase } from "./srcs/database/DataBase.js";
import { ServerV2 } from "./srcs/server/ServerV2.js";
import { Socket } from "./srcs/server/Socket.js";

(async () => {
  const contract = new ContractV2();
  const database = new DataBase();
  await database.startBdd();
  await database.deleteAllData();
  await database.deleteAllVolumes();
  await database.init();

  const server = new ServerV2(database);
  await server.init();
  
  const core = new Core(contract, server, database, null);
  const socket = new Socket(server, core.userManager);
  core.setSocket(socket);
  new Api(server.app, database, core);
  await core.init();
  await core.getLogsContract();

})();
