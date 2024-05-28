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
    delay: number; // Delay between reconnection attempts (in ms)
  }
  
  interface DatabaseConfig {
    user: string,
    password: string,
    host: string,
    database: string,
  }

  interface ViemConfig {
    reconnect: ReconnectConfig;
    retryCount: number; // Maximum number of retries for failed requests
    retryDelay: number; // Base delay between retry attempts (in ms)
    timeout: number; // Timeout for async WebSocket requests (in ms)
  }
  
// Interface for DatabaseV2Config
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

// Interface for Opt with the new databaseV2Config field
export interface Opt {
  busdContract: string;
  waitingRequests: number;
  wsUrl: string;
  viemConfig: ViemConfig;
  databaseConfig: DatabaseConfig;
  databaseV2Config: DatabaseV2Config; // Added the new configuration here
}

export interface User {
    socketId: string;
    address: string;
  }


export interface CustomSocket extends Socket {
    userAddress: string;
  }