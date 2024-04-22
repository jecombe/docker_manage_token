
export interface LogEntry {
    args: {
        from?: string;
        to?: string;
        value?: bigint;
        owner?: string;
        sender?: string;
    };
    eventName: string;
    blockNumber: bigint;
    transactionHash: string;
}


export interface LogOwner {
    args: {
        previousOwner?: string
    };
    eventName: string;
    blockNumber: bigint;
}

export interface Query {
    text: string;
    values?: (string | number | bigint | Date)[];
}

/*export interface QueryVolume {
    text: string;
    values?: (string | number | bigint)[];
}*/

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
    timestamp: Date;
    volume: string;
}


export interface Config {
    waiting: number;
    timeBlock: number;
}