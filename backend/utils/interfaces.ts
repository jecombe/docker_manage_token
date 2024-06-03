import { Socket } from "socket.io";

export interface LogEntry {
    args: {
        spender?: string ;
        from?: string;
        to?: string;
        value?: bigint;
        owner?: string;
        sender?: string;
        previousOwner?: string;

    };
    eventName: string;
    blockNumber: bigint;
    transactionHash: string;
}
  
export interface Query {
    text: string;
    values?: (string | number | bigint | Date)[];
}

export interface ParsedLog {
    eventName: string;
    from: string;
    to: string;
    blockNumber: string;
    value: number;
    transactionHash: string;
}

export interface ResultBdd {
    transactionhash: string;
    blocknumber: string;
    eventname: string;
    fromaddress: string;
    toaddress: string;
    value: string;
}


export interface ResultVolume {
    timestamp: string;
    volume: string;
}

interface ReconnectConfig {
    delay: number;
  }
  
  interface DatabaseConfig {
    user: string,
    password: string,
    host: string,
    database: string,
  }

  interface ViemConfig {
    reconnect: ReconnectConfig;
    retryCount: number;
    retryDelay: number;
    timeout: number;
  }
  
interface DatabaseV2Config {
  type: "postgres";
  database: string;
  username: string;
  password: string;
  host: string;
  entities: Function[];
  synchronize: boolean;
  logging: boolean;
}

export interface Opt {
  busdContract: string;
  waitingRequests: number;
  wsUrl: string;
  viemConfig: ViemConfig;
  databaseConfig: DatabaseConfig;
  databaseV2Config: DatabaseV2Config;
}

export interface User {
    socketId: string;
    address: string;
  }


export interface CustomSocket extends Socket {
    userAddress: string;
  }