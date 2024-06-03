
import dotenv from "dotenv";
import { loggerServer } from "../../utils/logger.js";
import { Server as SocketIOServer } from "socket.io";
import { CustomSocket, ParsedLog, ResultVolume } from "../../utils/interfaces.js";
import { ServerV2 } from "./ServerV2.js";
import { Socket } from "socket.io";
import { UserManager } from "../users/Users.js";
import { parsingWs } from "../../utils/parser.js";

dotenv.config();

export class SocketClient extends SocketIOServer {
  public managerUser: UserManager;
  constructor(server: ServerV2, managerUser: UserManager) {

    super(server.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.managerUser = managerUser;
    this.startWebSocketServer();
  }

  //public
  startWebSocketServer(): void {
    loggerServer.info('Start websocket');
    this.on('connection', (socket: Socket) => {
      const customSocket = socket as unknown as CustomSocket;
      const userAddress: string = customSocket.handshake.query.address as string;
      this.managerUser.addUser(customSocket.id, userAddress);

      customSocket.on('disconnect', () => {
        console.log('Client disconnected', customSocket);
        this.managerUser.removeUser(userAddress);
      });
    });
  }


  getSocketIds(addressTo: string, addressFrom: string) {
    const socketIdTo = this.managerUser.getSocketId(addressTo);
    const socketIdFrom = this.managerUser.getSocketId(addressFrom);

    return { socketIdTo, socketIdFrom };
  }


  sendingClient(data: ParsedLog, isRealTime: boolean) {
    const { socketIdTo, socketIdFrom } = this.getSocketIds(data.to, data.from);

    if (socketIdTo && isRealTime) this.sendDataToClientWithAddress(`${socketIdTo}`, data);
    if (socketIdFrom && isRealTime) this.sendDataToClientWithAddress(`${socketIdFrom}`, data);

    if (socketIdTo) this.sendWsToClient(`${socketIdTo}`, data);
    if (socketIdFrom) this.sendWsToClient(`${socketIdFrom}`, data);
  }

  sendDataToClientWithAddress(socketId: string, data: ParsedLog) {
    this.to(socketId).emit("data", parsingWs(data));
  }

  sendWsToAllClients(data: ParsedLog) {
    this.emit("allData", parsingWs(data));
  }

  sendWsToClient(socketId: string, data: ParsedLog) {
    this.to(socketId).emit("myData", parsingWs(data));
  }

  sendWsVolumeToAllClients(data: ResultVolume) {
    this.emit("volume", data);
  }
}


