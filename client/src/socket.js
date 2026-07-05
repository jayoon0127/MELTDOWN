import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export const socket = io(SERVER_URL, { autoConnect: true });

// Socket.io retries connection failures silently by default — nothing here
// throws or rejects, so without this the UI just looks frozen with no clue
// why (wrong VITE_SERVER_URL, a CORS rejection, or the host still waking up
// from a free-tier sleep all look identical: nothing happens). Logging them
// is the fastest way to tell those apart from the browser console.
socket.on("connect_error", (err) => {
  console.error(`[socket] connect_error while trying ${SERVER_URL}:`, err.message, err);
});
socket.on("disconnect", (reason) => {
  console.warn("[socket] disconnected:", reason);
});
