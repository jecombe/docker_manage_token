import { Manager } from "./srcs/Manager.js";
import { Config } from "./utils/interfaces.js";
import { loggerServer } from "./utils/logger.js";

(async () => {
  const config: Config = {
    waiting: 2000,
    timeBlock: 14

  };
  const manager = new Manager(config);
  try {
    manager.startServer();
  } catch (error) {
    loggerServer.error("Starting", error);
  }
})();
