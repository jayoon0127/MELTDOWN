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
      if (room.voiceParticipants.has(socket.id)) {
        room.voiceParticipants.delete(socket.id);
        socket.to(room.code).emit("voice:peer-left", { peerId: socket.id });
      }
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

  socket.on("room:create", ({ name, isPublic } = {}, cb) => {
    const room = manager.createRoom(socket.id, { isPublic: !!isPublic });
    room.addPlayer(socket.id, safeName(name));
    socket.join(room.code);
    currentRoomCode = room.code;
    cb?.({ ok: true, me: socket.id, room: room.serialize() });
    broadcastRoom(room);
  });

  socket.on("room:quickmatch", ({ name } = {}, cb) => {
    let room = manager.findQuickMatch();
    if (!room) room = manager.createRoom(socket.id, { isPublic: true });
    const result = room.addPlayer(socket.id, safeName(name));
    if (result.error) return cb?.({ error: result.error });
    socket.join(room.code);
    currentRoomCode = room.code;
    cb?.({ ok: true, me: socket.id, room: room.serialize() });
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
    cb?.({ ok: true, me: socket.id, room: room.serialize() });
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

  socket.on("player:move", ({ x, y } = {}) => {
    const room = manager.get(currentRoomCode);
    if (!room || room.status !== "playing") return;
    room.movePlayer(socket.id, x, y);
    broadcastRoom(room);
  });

  socket.on("chat:send", ({ text }) => {
    const room = manager.get(currentRoomCode);
    if (!room || !text || !String(text).trim()) return;
    const entry = room.addChat(socket.id, text);
    io.to(room.code).emit("chat:message", entry);
  });

  socket.on("voice:join", (_payload, cb) => {
    const room = manager.get(currentRoomCode);
    if (!room) return cb?.({ error: "방에 먼저 입장하세요." });
    const others = [...room.voiceParticipants].filter((id) => id !== socket.id);
    room.voiceParticipants.add(socket.id);
    socket.to(room.code).emit("voice:peer-joined", { peerId: socket.id });
    cb?.({ ok: true, peers: others });
  });

  socket.on("voice:leave", () => {
    const room = manager.get(currentRoomCode);
    if (!room || !room.voiceParticipants.has(socket.id)) return;
    room.voiceParticipants.delete(socket.id);
    socket.to(room.code).emit("voice:peer-left", { peerId: socket.id });
  });

  socket.on("voice:signal", ({ to, data } = {}) => {
    if (!to || !data) return;
    io.to(to).emit("voice:signal", { from: socket.id, data });
  });

  socket.on("voice:mute", ({ muted } = {}) => {
    const room = manager.get(currentRoomCode);
    if (!room) return;
    socket.to(room.code).emit("voice:mute", { peerId: socket.id, muted: !!muted });
  });

  socket.on("voice:speaking", ({ speaking } = {}) => {
    const room = manager.get(currentRoomCode);
    if (!room) return;
    socket.to(room.code).emit("voice:speaking", { peerId: socket.id, speaking: !!speaking });
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
