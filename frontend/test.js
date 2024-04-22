const logsArray = [
  {
    address: "0x15a40d37e6f8a478dde2cb18c83280d472b2fc35",
    args: {from: '0x0000000000000000000000000000000000000000', to: '0xbbd95f266F32563aA6A813469947B09cA3727bdb', value: 1000000000000000000n},
    blockHash: "0xfe18aa0ee241802d2bd7428f510124e6c68da7b9dfed9abe898149fadf4c9269",
    blockNumber: 48019055n,
    data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
    eventName: "Transfer",
    logIndex: 2,
    removed: false,
    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x000000000000000000000000bbd95f266f32563aa6a813469947b09ca3727bdb'],
    transactionHash: "0x68807e571ac655926f0237788a1f6811dcaa71f4fcd9ccdb75dc66331cd3767a",
    transactionIndex: 1
  },
  {
    address: "0x15a40d37e6f8a478dde2cb18c83280d472b2fc35",
    args: {from: '0x0000000000000000000000000000000000000000', to: '0xbbd95f266F32563aA6A813469947B09cA3727bdb', value: 1000000000000000000n},
    blockHash: "0xfd930afe7548f7eb1b05c4fef52316a640e68682cde1ce25920b55c7eb389685",
    blockNumber: 48019115n,
    data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
    eventName: "Transfer",
    logIndex: 4,
    removed: false,
    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x000000000000000000000000000000000']
  }
]

let save = [{tranfer: [{"111": {
  from:1,
  to:1,
  value:1

}}]}, {approval: []}]


const parsedLogs = logsArray.reduce((accumulator, currentLog) => {
  // Ajoutez votre logique de parsing ici
  // Dans cet exemple, nous allons simplement extraire l'adresse et les arguments de chaque objet
  const { address, args, eventName, blockNumber } = currentLog;

  let parsedLog = {}

  if (eventName === "Tranfer") {
    parsedLog = {
      from: args.from,
      to: args.to,
      blockNumber,
      value: args.value.toString(),
    }

  }

  if (eventName === "Approval") {
    parsedLog = {
      event: "approval",
      blockNumber,
      owner: args.from,
      sender: args.to,
      value: args.value.toString(),
    }

  }
 
  // Ajoutez l'objet parsé à l'accumulateur
  accumulator.push(parsedLog);
  
  // Retournez l'accumulateur pour la prochaine itération
  return accumulator;
}, []);
