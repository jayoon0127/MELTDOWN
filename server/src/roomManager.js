import { customAlphabet } from "nanoid";
import { Room } from "./game/Room.js";

const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> Room
  }

  createRoom(hostId) {
    let code;
    do {
      code = genCode();
    } while (this.rooms.has(code));
    const room = new Room(code, hostId);
    this.rooms.set(code, room);
    return room;
  }

  get(code) {
    return this.rooms.get(String(code || "").toUpperCase());
  }

  delete(code) {
    const room = this.rooms.get(code);
    if (room) room.stop();
    this.rooms.delete(code);
  }
}
