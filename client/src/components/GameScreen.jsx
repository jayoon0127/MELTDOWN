import { useMemo, useRef, useState } from "react";
import StatGauge from "./StatGauge";
import GameMap from "./GameMap";
import Joystick from "./Joystick";
import ActionPanel from "./ActionPanel";
import Chat from "./Chat";
import VoicePanel from "./VoicePanel";
import { formatTime } from "../statMeta";
import { useMovement } from "../useMovement";
import { applyWorldPosition, toWorld, toNormalized } from "./three/worldMap";
import { buildWallColliders, resolveWallCollision } from "./three/collision";

export default function GameScreen({ room, myId, onWork, onSend, onRestart, voice }) {
  const [currentZoneId, setCurrentZoneId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const powerOut = room.stats.power <= 0;
  const obscured = room.incidents.some((i) => i.obscuresStats);
  const me = room.players.find((p) => p.id === myId);
  const isHost = room.hostId === myId;
  const isOver = room.status === "won" || room.status === "lost";

  const initialPosRef = useRef({ x: me?.x ?? 0.5, y: me?.y ?? 0.5 });

  const resolveCollision = useMemo(() => {
    const rects = buildWallColliders(room.zones);
    return (pos) => {
      const [wx, , wz] = toWorld(pos.x, pos.y);
      const { x, z } = resolveWallCollision(wx, wz, rects);
      return toNormalized(x, z);
    };
  }, [room.zones]);

  const { avatarElRef, setJoystickVector } = useMovement({
    initialPos: initialPosRef.current,
    zones: room.zones,
    onZoneChange: setCurrentZoneId,
    applyPosition: applyWorldPosition,
    resolveCollision,
  });

  const currentZone = useMemo(
    () => room.zones.find((z) => z.id === currentZoneId) || null,
    [room.zones, currentZoneId]
  );

  return (
    <div className={`screen game-screen ${powerOut ? "blackout" : ""}`}>
      <div className="game-top">
        <div className="timer">⏱ {formatTime(room.timeRemaining)}</div>
        <div className="stats-row">
          {Object.entries(room.stats).map(([key, value]) => (
            <StatGauge key={key} statKey={key} value={value} obscured={obscured} />
          ))}
        </div>
      </div>

      <div className="game-body">
        <div className="map-wrap">
          <GameMap
            zones={room.zones}
            incidents={room.incidents}
            players={room.players}
            myId={myId}
            myName={me?.name}
            blackout={powerOut}
            avatarElRef={avatarElRef}
          />

          <button className="chat-toggle-btn" onClick={() => setChatOpen((v) => !v)}>
            💬
          </button>

          <div className="hud-bottom">
            <Joystick onChange={setJoystickVector} />
            <ActionPanel
              zone={currentZone}
              incidents={room.incidents}
              players={room.players}
              myId={myId}
              myWorkingOn={me?.workingOn}
              onWork={onWork}
            />
          </div>
        </div>

        <div className={`side-col ${chatOpen ? "open" : ""}`}>
          <VoicePanel voice={voice} players={room.players} myId={myId} />
          <Chat chat={room.chat} onSend={onSend} />
        </div>
      </div>

      {isOver && (
        <div className="end-overlay">
          <div className="end-card">
            <h2>{room.status === "won" ? "✅ 생존 성공!" : "💥 멜트다운"}</h2>
            <p>{room.loseReason || "발전소를 무사히 지켜냈습니다."}</p>
            {isHost ? (
              <button className="primary-btn" onClick={onRestart}>
                대기실로 돌아가기
              </button>
            ) : (
              <p className="waiting">방장이 다음 판을 준비하고 있습니다...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
