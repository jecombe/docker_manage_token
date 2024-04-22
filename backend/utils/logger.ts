import log4js, { Configuration, Logger } from "log4js";

const logConfig: Configuration = {
  appenders: {
    server: {
      type: "console",
      filename: "./logs/server.log",
      layout: { type: "pattern", pattern: "%[[%d] %5.5p -%] %m" },
    }
  },
  categories: {
    default: { appenders: ["server"], level: "all" },
  }
};

log4js.configure(logConfig);

export const loggerServer: Logger = log4js.getLogger("server");