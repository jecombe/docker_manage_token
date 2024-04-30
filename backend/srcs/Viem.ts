
import dotenv from "dotenv";
import { Chain, Log, PublicClient, WatchContractEventReturnType, createPublicClient, formatEther, http, webSocket } from "viem";
import { sepolia } from "viem/chains";
import { loggerServer } from "../utils/logger";
import abi from "../utils/abi.js";

dotenv.config();

export class Viem {
  public cliPublic: PublicClient;
  public ws: PublicClient;
  private wsUrl: string;


  constructor() {
    this.wsUrl = 'wss://sepolia.infura.io/ws/v3/3576824e640441d38580334356ef5046';

    this.cliPublic = this.connectPublicClient();//this.connectPublicClient();
    this.ws = this.connectPublicWs();
  }

  connectPublicWs(): PublicClient {
    console.log(this.wsUrl);

    return createPublicClient({
      chain: sepolia as Chain,
      transport: webSocket(this.wsUrl, {
        reconnect: {
          // maxAttempts:
          delay: 2000, // Delay between reconnection attempts (in ms)
        },
        retryCount: 3, // Maximum number of retries for failed requests
        retryDelay: 150, // Base delay between retry attempts (in ms)
        timeout: 10000, // Timeout for async WebSocket requests (in ms)
      }),
    });
  }

  formatToEth(number: bigint): string {
    return formatEther(number);

  }

  connectPublicClient(): PublicClient {
    return createPublicClient({
      chain: sepolia as Chain,
      transport: http(),
    });
  }
  startListener(callback: (logs: Log[]) => void): WatchContractEventReturnType {
    loggerServer.info("Listening Events smart contract...");
    return this.cliPublic.watchContractEvent({
      address: `0x${process.env.CONTRACT}`,
      abi,
      onLogs: callback,
    });
  }


  async getActualBlock(): Promise<bigint> {
    return this.cliPublic.getBlockNumber();
  }
}