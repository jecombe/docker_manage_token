import { Analyze } from "./srcs/core/Analyze.js";
import { Opt } from "./utils/interfaces.js";


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
  }
};

(async () => {
  try {
    const analyze = new Analyze(opt);
    await analyze.init();
    analyze.startApp();
  } catch (error) {
    console.log(error);
  }
})();
