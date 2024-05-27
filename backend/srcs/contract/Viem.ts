
import dotenv from "dotenv";
import * as ViemPkg from "viem";
import { sepolia } from "viem/chains";
import { loggerServer } from "../../utils/logger";
import abi from "../../utils/abi.js";
import { Opt } from "../../utils/interfaces";

dotenv.config();

export class Viem {
  public cliPublic: ViemPkg.PublicClient;
  public ws: ViemPkg.PublicClient;
  private opt: Opt;


  constructor(opt: Opt) {
    this.opt = opt;
    this.cliPublic = this.connectPublicClient();
    this.ws = this.connectPublicWs();
  }

  connectPublicWs(): ViemPkg.PublicClient {
    return ViemPkg.createPublicClient({
      chain: sepolia as ViemPkg.Chain,
      transport: ViemPkg.webSocket(this.opt.wsUrl, this.opt.viemConfig),
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
      address: `0x${this.opt.busdContract}`,
      abi,
      onLogs: callback,
    });
  }


  /*async getLogs(fromBlock: bigint, toBlock: bigint, abi: readonly string[]): Promise<LogEntry[]> {
    return this.cliPublic.getLogs({
      address: `0x${process.env.CONTRACT}`,
      events: ViemPkg.parseAbi(abi),
      fromBlock,
      toBlock,
    });
  }*/

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