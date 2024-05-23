
import dotenv from "dotenv";
import * as ViemPkg from "viem";
import { sepolia } from "viem/chains";
import { loggerServer } from "../../utils/logger";
import abi from "../../utils/abi.js";

dotenv.config();

export class Viem {
  public cliPublic: ViemPkg.PublicClient;
  public ws: ViemPkg.PublicClient;
  private wsUrl: string;


  constructor() {
    this.wsUrl = 'wss://sepolia.infura.io/ws/v3/3576824e640441d38580334356ef5046';
    this.cliPublic = this.connectPublicClient();
    this.ws = this.connectPublicWs();
  }

  connectPublicWs(): ViemPkg.PublicClient {
    return ViemPkg.createPublicClient({
      chain: sepolia as ViemPkg.Chain,
      transport: ViemPkg.webSocket(this.wsUrl, {
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


  connectPublicClient(): ViemPkg.PublicClient {
    return ViemPkg.createPublicClient({
      chain: sepolia as ViemPkg.Chain,
      transport: ViemPkg.http(),
    });
  }

  startListener(callback: (logs: ViemPkg.Log[]) => void): ViemPkg.WatchContractEventReturnType {
    loggerServer.info("Listening Events smart contract...");
    return this.ws.watchContractEvent({
      address: `0x${process.env.CONTRACT}`,
      abi,
      onLogs: callback,
    });
  }

  formatEther(nb: bigint, unit?: "wei" | "gwei" | undefined): string {
    return ViemPkg.formatEther(nb, unit);
  }

  parseAbis(array: readonly string[]): ReturnType<typeof ViemPkg.parseAbi> {
    return ViemPkg.parseAbi(array);
  }

  async getActualBlock(): Promise<bigint> {
    return this.cliPublic.getBlockNumber();
  }
}