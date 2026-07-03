import { customAlphabet } from "nanoid";
import { Room } from "./game/Room.js";

const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> Room
  }

  createRoom(hostId, { isPublic = false } = {}) {
    let code;
    do {
      code = genCode();
    } while (this.rooms.has(code));
    const room = new Room(code, hostId);
    room.isPublic = isPublic;
    this.rooms.set(code, room);
    return room;
  }

  get(code) {
    return this.rooms.get(String(code || "").toUpperCase());
  }

  // Find an open public lobby to drop a player into, or create a fresh one.
  findQuickMatch() {
    for (const room of this.rooms.values()) {
      if (room.isPublic && room.status === "lobby" && room.playerList.length < 8) {
        return room;
      }
    }
    return null;
  }

  delete(code) {
    const room = this.rooms.get(code);
    if (room) room.stop();
    this.rooms.delete(code);
  }
}
