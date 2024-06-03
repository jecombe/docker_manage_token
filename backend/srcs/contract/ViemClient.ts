
import dotenv from "dotenv";
import { sepolia } from "viem/chains";
import { loggerServer } from "../../utils/logger.js";
import abi from "../../utils/abi.js";
import { Opt } from "../../utils/interfaces.js";
import { Chain, Log, PublicClient, WatchContractEventReturnType, createPublicClient, http, webSocket } from "viem";

dotenv.config();

export class ViemClient {
  public cliPublic: PublicClient;
  public ws: PublicClient;
  private opt: Opt;

  constructor(opt: Opt) {
    this.opt = opt;
    this.cliPublic = this.connectPublicClient();
    this.ws = this.connectPublicWs();
  }

  connectPublicWs(): PublicClient {
    return createPublicClient({
      chain: sepolia as Chain,
      transport: webSocket(this.opt.wsUrl, this.opt.viemConfig),
    });
  }

  connectPublicClient(): PublicClient {
    return createPublicClient({
      chain: sepolia as Chain,
      transport: http(),
    });
  }

  startListener(callback: (logs: Log[]) => void): WatchContractEventReturnType {
    loggerServer.info("Listening Events smart contract...");
    return this.ws.watchContractEvent({
      address: `0x${this.opt.busdContract}`,
      abi,
      onLogs: callback,
    });
  }

  async getActualBlock(): Promise<bigint> {
    return this.cliPublic.getBlockNumber();
  }
}