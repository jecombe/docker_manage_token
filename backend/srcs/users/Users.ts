import { User } from "../../utils/interfaces.js";

export class UserManager {
  private users: { [address: string]: User };

  constructor() {
    this.users = {};
  }

  addUser(socketId: string, address: string) {
    if (address in this.users) {
      if (this.users[address].socketId !== socketId) {
        this.users[address].socketId = socketId;
        this.users[address].address = address;
      }
    } else {
      this.users[address] = { socketId, address };
    }    
  }

  getSocketId(addr: string): User {
    return this.users[addr];
  }

  removeUser(address: string) {
    if (address in this.users) {
      delete this.users[address];
      console.log(`User with address ${address} has been removed.`);
    } else {
      console.log(`User with address ${address} does not exist.`);
    }
  }
}
