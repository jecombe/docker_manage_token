
import dotenv from "dotenv";
import { Chain, PublicClient, createPublicClient, formatEther, http } from "viem";
import { sepolia } from "viem/chains";

dotenv.config();

export class Viem {
  public cliPublic: PublicClient;

  constructor() {
    this.cliPublic = this.connectPublicClient();
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

  async getActualBlock(): Promise<bigint> {
    return this.cliPublic.getBlockNumber();
  }
}