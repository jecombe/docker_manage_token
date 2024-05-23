
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import { Server as SocketIOServer } from "socket.io";
import { CustomSocket, ParsedLog, ResultVolume, User } from "../../utils/interfaces.js";
import { ServerV2 } from "./ServerV2.js";
import { Socket as Sck } from "socket.io";
import { UserManager } from "../Users.js";

dotenv.config();

export class Socket extends SocketIOServer {
  private managerUser: UserManager;
  constructor(server: ServerV2, managerUser: UserManager ) {
    super(server.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.managerUser = managerUser;
    this.startWebSocketServer();
  }

  startWebSocketServer(): void {
    loggerServer.info('Start websocket');
    this.on('connection', (socket: Sck) => {
      const customSocket = socket as unknown as CustomSocket;
      const userAddress: string = customSocket.handshake.query.address as string;
      this.managerUser.addUser(customSocket.id, userAddress);

      customSocket.on('disconnect', () => {
        console.log('Client disconnected', customSocket);
        this.managerUser.removeUser(userAddress);
      });
    });
  }
  parsingWs(repWs: ParsedLog) {
    return {
      blocknumber: repWs.blockNumber,
      eventname: repWs.eventName,
      fromaddress: repWs.from,
      toaddress: repWs.to,
      transactionhash: repWs.transactionHash,
      value: repWs.value
    };
  }

  sendDataToClientWithAddress(socketId: string, data: ParsedLog) {
    this.to(socketId).emit("data", data);
  }

  sendWsToAllClients(data: ParsedLog) {
    this.emit("allData", data);
  }

  sendWsToClient(socketId: string, data: ParsedLog) {
    this.to(socketId).emit("myData", this.parsingWs(data));
  }

  sendWsVolumeToAllClients(data: ResultVolume) {
    this.emit("volume", data);
  }
}


