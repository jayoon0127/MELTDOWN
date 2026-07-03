import { useEffect, useState, useCallback } from "react";
import { socket } from "./socket";
import { useVoiceChat } from "./useVoice";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import GameScreen from "./components/GameScreen";

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

    socket.on("room:state", onRoomState);
    socket.on("chat:message", onChatMessage);
    return () => {
      socket.off("room:state", onRoomState);
      socket.off("chat:message", onChatMessage);
    };
  }, []);

  const handleCreate = useCallback((name) => {
    setError("");
    socket.emit("room:create", { name }, (res) => {
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
    socket.emit("room:join", { name, code }, (res) => {
      if (res?.error) setError(res.error);
      else {
        setMyId(res.me);
        setRoom(res.room);
      }
    });
  }, []);

  const handleQuickMatch = useCallback((name) => {
    setError("");
    socket.emit("room:quickmatch", { name }, (res) => {
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
      onSend={handleSend}
      onRestart={handleRestart}
      voice={voice}
    />
  );
}
