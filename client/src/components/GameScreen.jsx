import StatGauge from "./StatGauge";
import ZonePanel from "./ZonePanel";
import Chat from "./Chat";
import { formatTime } from "../statMeta";

export default function GameScreen({ room, myId, onWork, onSend, onRestart }) {
  const powerOut = room.stats.power <= 0;
  const obscured = room.incidents.some((i) => i.obscuresStats);
  const me = room.players.find((p) => p.id === myId);
  const isHost = room.hostId === myId;
  const isOver = room.status === "won" || room.status === "lost";

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
        <div className="zones-grid">
          {room.zones.map((zone) => (
            <ZonePanel
              key={zone.id}
              zone={zone}
              incidents={room.incidents}
              players={room.players}
              myId={myId}
              myWorkingOn={me?.workingOn}
              blackout={powerOut}
              onWork={onWork}
            />
          ))}
        </div>
        <Chat chat={room.chat} onSend={onSend} />
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
