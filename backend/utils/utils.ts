
export const waiting = async (timer: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, timer));
};

export const existsBigIntInArray = (arr: bigint[], value: bigint): boolean => {
  return arr.some((item) => item === value);
};

export const calculateBlocksPerDay = (blockIntervalSeconds: number): number => {
  const secondsInDay = 24 * 60 * 60;
  const blocksPerDay = secondsInDay / blockIntervalSeconds;
  return Math.round(blocksPerDay);
};

export const subtractOneDay = (currentDate: Date): Date => {
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const currentTimestamp = currentDate.getTime();
  const newTimestamp = currentTimestamp - oneDayInMilliseconds;
  return new Date(newTimestamp);
};

export const removeTimeFromDate = (currentDate: Date): Date => {  
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  const day = currentDate.getUTCDate();

  const dateOnly = new Date(Date.UTC(year, month, day));
  
  return dateOnly;
};

export const parseTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toString();
};

export const compareDates = (date1: Date, date2: Date): boolean => {
  const time1 = date1.getTime();
  const time2 = date2.getTime();

  const diffTime = Math.abs(time1 - time2);

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return false;
  }
  return true;
};


export const getRangeBlock = (batchSize: bigint, accumulator: number, blockNumber: bigint): { fromBlock: bigint; toBlock: bigint } => {
  const fromBlock: bigint = blockNumber - batchSize * BigInt(accumulator + 1);
  const toBlock: bigint = blockNumber - batchSize * BigInt(accumulator);
  return { fromBlock, toBlock };
};


export const loggingDate = (time: Date) => {
  const dateRemoveHours = removeTimeFromDate(time || new Date());
  return dateRemoveHours.toISOString().split('T')[0];
};

export const getRateLimits = (): number => {
  const requestsPerMinute: number = 1800;
  const millisecondsPerMinute: number = 60000;
  return millisecondsPerMinute / requestsPerMinute;
};

export const waitingRate = async (batchStartTime: number, timePerRequest: number): Promise<void> => {
  const elapsedTime: number = Date.now() - batchStartTime;
  const waitTime: number = Math.max(0, timePerRequest - elapsedTime);
  return waiting(waitTime);
};

export const isElementInArray = (array: string[], element: Date) => {
  const ts = removeTimeFromDate(element);
  const timestamp = ts.toISOString().split('T')[0];

  return array.map(String).includes(timestamp);
};