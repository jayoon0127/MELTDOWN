import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomManager } from "./roomManager.js";

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

const manager = new RoomManager();

function broadcastRoom(room) {
  io.to(room.code).emit("room:state", room.serialize());
}

io.on("connection", (socket) => {
  let currentRoomCode = null;

  const leaveCurrentRoom = () => {
    if (!currentRoomCode) return;
    const room = manager.get(currentRoomCode);
    if (room) {
      room.removePlayer(socket.id);
      if (room.isEmpty()) {
        manager.delete(room.code);
      } else {
        broadcastRoom(room);
      }
    }
    socket.leave(currentRoomCode);
    currentRoomCode = null;
  };

  socket.on("room:create", ({ name }, cb) => {
    const room = manager.createRoom(socket.id);
    room.addPlayer(socket.id, safeName(name));
    socket.join(room.code);
    currentRoomCode = room.code;
    cb?.({ ok: true, room: room.serialize() });
    broadcastRoom(room);
  });

  socket.on("room:join", ({ code, name }, cb) => {
    const room = manager.get(code);
    if (!room) return cb?.({ error: "존재하지 않는 방 코드입니다." });
    if (room.status === "playing") return cb?.({ error: "이미 게임이 진행 중입니다." });
    const result = room.addPlayer(socket.id, safeName(name));
    if (result.error) return cb?.({ error: result.error });
    socket.join(room.code);
    currentRoomCode = room.code;
    cb?.({ ok: true, room: room.serialize() });
    broadcastRoom(room);
  });

  socket.on("room:start", () => {
    const room = manager.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.status === "playing") return;
    room.start(
      (state) => io.to(room.code).emit("room:state", state),
      (state) => io.to(room.code).emit("room:state", state)
    );
    broadcastRoom(room);
  });

  socket.on("room:restart", () => {
    const room = manager.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;
    room.stop();
    room.status = "lobby";
    broadcastRoom(room);
  });

  socket.on("incident:work", ({ incidentId }) => {
    const room = manager.get(currentRoomCode);
    if (!room || room.status !== "playing") return;
    if (incidentId && !room.incidents.has(incidentId)) return;
    room.setWorking(socket.id, incidentId || null);
    broadcastRoom(room);
  });

  socket.on("chat:send", ({ text }) => {
    const room = manager.get(currentRoomCode);
    if (!room || !text || !String(text).trim()) return;
    const entry = room.addChat(socket.id, text);
    io.to(room.code).emit("chat:message", entry);
  });

  socket.on("disconnect", () => {
    leaveCurrentRoom();
  });
});

function safeName(name) {
  const n = String(name || "").trim().slice(0, 20);
  return n || `요원${Math.floor(Math.random() * 900 + 100)}`;
}

server.listen(PORT, () => {
  console.log(`Meltdown server listening on :${PORT}`);
});
