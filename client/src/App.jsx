import { useEffect, useState, useCallback } from "react";
import { socket } from "./socket";
import { useVoiceChat } from "./useVoice";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import GameScreen from "./components/GameScreen";

// Room create/join/quickmatch normally ack within a few hundred ms. If the
// server can't be reached at all (bad VITE_SERVER_URL, CORS rejection, or a
// free-hosting-tier server still waking up from sleep), socket.io just
// keeps retrying forever with no ack — so without a timeout, the UI would
// wait silently and look frozen instead of telling the player anything.
const ACK_TIMEOUT_MS = 10000;

function emitWithTimeout(event, payload, cb) {
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    cb({
      error:
        "서버로부터 응답이 없습니다. 서버가 잠들어 있다가 깨어나는 중일 수 있어요 — 잠시 후 다시 시도해주세요.",
    });
  }, ACK_TIMEOUT_MS);
  socket.emit(event, payload, (res) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    cb(res);
  });
}

export default function App() {
  const [myId, setMyId] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const voice = useVoiceChat();

  useEffect(() => {
    function onRoomState(state) {
      setRoom(state);
    }
    function onChatMessage(entry) {
      setRoom((prev) => (prev ? { ...prev, chat: [...prev.chat, entry] } : prev));
    }
    function onConnectError(err) {
      setError(`서버(${socket.io.uri})에 연결할 수 없습니다: ${err.message}`);
    }
    function onConnect() {
      setError((prev) => (prev.startsWith("서버(") ? "" : prev));
    }

    socket.on("room:state", onRoomState);
    socket.on("chat:message", onChatMessage);
    socket.on("connect_error", onConnectError);
    socket.on("connect", onConnect);
    return () => {
      socket.off("room:state", onRoomState);
      socket.off("chat:message", onChatMessage);
      socket.off("connect_error", onConnectError);
      socket.off("connect", onConnect);
    };
  }, []);

  const handleCreate = useCallback((name) => {
    setError("");
    emitWithTimeout("room:create", { name }, (res) => {
      if (res?.error) setError(res.error);
      else {
        setMyId(res.me);
        setRoom(res.room);
      }
    });
  }, []);

  const handleJoin = useCallback((name, code) => {
    setError("");
    if (!code.trim()) {
      setError("방 코드를 입력해주세요.");
      return;
    }
    emitWithTimeout("room:join", { name, code }, (res) => {
      if (res?.error) setError(res.error);
      else {
        setMyId(res.me);
        setRoom(res.room);
      }
    });
  }, []);

  const handleQuickMatch = useCallback((name) => {
    setError("");
    emitWithTimeout("room:quickmatch", { name }, (res) => {
      if (res?.error) setError(res.error);
      else {
        setMyId(res.me);
        setRoom(res.room);
      }
    });
  }, []);

  const handleStart = useCallback(() => {
    socket.emit("room:start");
  }, []);

  const handleRestart = useCallback(() => {
    socket.emit("room:restart");
  }, []);

  const handleWork = useCallback((incidentId) => {
    socket.emit("incident:work", { incidentId });
  }, []);

  const handleBoost = useCallback((incidentId) => {
    socket.emit("incident:boost", { incidentId });
  }, []);

  const handlePickup = useCallback((itemId) => {
    socket.emit("item:pickup", { itemId });
  }, []);

  const handleDrop = useCallback(() => {
    socket.emit("item:drop");
  }, []);

  const handleUseItem = useCallback(() => {
    socket.emit("item:use");
  }, []);

  const handleEatItem = useCallback(() => {
    socket.emit("item:eat");
  }, []);

  const handleSend = useCallback((text) => {
    socket.emit("chat:send", { text });
  }, []);

  if (!room) {
    return (
      <Home
        onCreate={handleCreate}
        onJoin={handleJoin}
        onQuickMatch={handleQuickMatch}
        error={error}
      />
    );
  }

  if (room.status === "lobby") {
    return <Lobby room={room} myId={myId} onStart={handleStart} voice={voice} />;
  }

  return (
    <GameScreen
      room={room}
      myId={myId}
      onWork={handleWork}
      onBoost={handleBoost}
      onPickup={handlePickup}
      onDrop={handleDrop}
      onUseItem={handleUseItem}
      onEatItem={handleEatItem}
      onSend={handleSend}
      onRestart={handleRestart}
      voice={voice}
    />
  );
}
