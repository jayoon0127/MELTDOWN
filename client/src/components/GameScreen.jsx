import { useCallback, useMemo, useRef, useState } from "react";
import StatGauge from "./StatGauge";
import GameMap from "./GameMap";
import Joystick from "./Joystick";
import ActionPanel from "./ActionPanel";
import ItemHud from "./ItemHud";
import MissionModal from "./MissionModal";
import Chat from "./Chat";
import VoicePanel from "./VoicePanel";
import { formatTime } from "../statMeta";
import { useMovement } from "../useMovement";
import { applyWorldPosition, toWorld, toNormalized } from "./three/worldMap";
import { buildWallColliders, resolveWallCollision } from "./three/collision";

const ITEM_NEAR_RADIUS = 0.06;

// Flavor text for the eat/drink toast. Anything not listed here falls back
// to a generic line based on whether the net effect was good or bad — the
// extinguisher gets its own line since eating it is the punchline.
const EAT_FLAVOR = {
  FIRE_EXTINGUISHER: "🤢 우웩... 소화기 분말은 먹는 게 아니었다!",
};

function eatFlavorFor(item) {
  if (EAT_FLAVOR[item.typeId]) return EAT_FLAVOR[item.typeId];
  const net = (item.eatEffect?.hunger || 0) + (item.eatEffect?.thirst || 0);
  return net >= 0 ? `${item.icon} 맛있다!` : `${item.icon} 우웩...`;
}

export default function GameScreen({ room, myId, onWork, onBoost, onPickup, onDrop, onUseItem, onEatItem, onSend, onRestart, voice }) {
  const [currentZoneId, setCurrentZoneId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [missionIncidentId, setMissionIncidentId] = useState(null);
  const [toast, setToast] = useState(null); // { message, at }
  const powerOut = room.stats.power <= 0;
  const obscured = room.incidents.some((i) => i.obscuresStats);
  const me = room.players.find((p) => p.id === myId);
  const isHost = room.hostId === myId;
  const isOver = room.status === "won" || room.status === "lost";

  const items = room.items || [];
  const myItem = items.find((it) => it.carriedBy === myId) || null;
  const nearbyItems = items.filter((it) => {
    if (it.carriedBy) return false;
    if (it.zoneId) return it.zoneId === currentZoneId;
    if (it.x != null && me) return Math.hypot(me.x - it.x, me.y - it.y) <= ITEM_NEAR_RADIUS;
    return false;
  });
  const canUseHere =
    !!myItem &&
    !!myItem.usableOn &&
    !!currentZoneId &&
    room.incidents.some((i) => i.zone === currentZoneId && myItem.usableOn.includes(i.typeId));

  const showToast = useCallback((message) => setToast({ message, at: Date.now() }), []);

  function handleEatItem() {
    if (myItem) showToast(eatFlavorFor(myItem));
    onEatItem();
  }

  const missionIncident = room.incidents.find((i) => i.id === missionIncidentId) || null;

  function handleOpenMission(inc) {
    if (me?.workingOn !== inc.id) onWork(inc.id);
    setMissionIncidentId(inc.id);
  }

  function handleMissionSolved() {
    onBoost(missionIncidentId);
    setMissionIncidentId(null);
  }

  const initialPosRef = useRef({ x: me?.x ?? 0.5, y: me?.y ?? 0.5 });

  const resolveCollision = useMemo(() => {
    const rects = buildWallColliders(room.zones);
    return (pos) => {
      const [wx, , wz] = toWorld(pos.x, pos.y);
      const { x, z } = resolveWallCollision(wx, wz, rects);
      return toNormalized(x, z);
    };
  }, [room.zones]);

  const handleSlip = useCallback(() => {
    showToast("🍌 미끄러짐!");
  }, [showToast]);

  const { avatarElRef, setJoystickVector } = useMovement({
    initialPos: initialPosRef.current,
    zones: room.zones,
    hazards: room.hazards,
    onZoneChange: setCurrentZoneId,
    onSlip: handleSlip,
    applyPosition: applyWorldPosition,
    resolveCollision,
  });

  const currentZone = useMemo(
    () => room.zones.find((z) => z.id === currentZoneId) || null,
    [room.zones, currentZoneId]
  );

  const toastVisible = toast && Date.now() - toast.at < 1500;

  if (import.meta.env.DEV) window.__meltdownRoom = room;

  return (
    <div className={`screen game-screen ${powerOut ? "blackout" : ""}`}>
      <div className="game-top">
        <div className="timer">⏱ {formatTime(room.timeRemaining)}</div>
        <div className="stats-row">
          {Object.entries(room.stats).map(([key, value]) => (
            <StatGauge key={key} statKey={key} value={value} obscured={obscured} />
          ))}
        </div>
        {me && (
          <div className="stats-row player-status-row">
            <StatGauge statKey="hunger" value={me.hunger} />
            <StatGauge statKey="thirst" value={me.thirst} />
          </div>
        )}
      </div>

      <div className="game-body">
        <div className="map-wrap">
          <GameMap
            zones={room.zones}
            incidents={room.incidents}
            items={items}
            hazards={room.hazards || []}
            players={room.players}
            myId={myId}
            myName={me?.name}
            blackout={powerOut}
            avatarElRef={avatarElRef}
          />

          <button className="chat-toggle-btn" onClick={() => setChatOpen((v) => !v)}>
            💬
          </button>

          {toastVisible && <div className="hud-toast">{toast.message}</div>}

          <div className="hud-bottom">
            <Joystick onChange={setJoystickVector} />
            <div className="hud-bottom-panels">
              <ItemHud
                myItem={myItem}
                nearbyItems={nearbyItems}
                canUseHere={canUseHere}
                onPickup={onPickup}
                onDrop={onDrop}
                onUse={onUseItem}
                onEat={handleEatItem}
              />
              <ActionPanel
                zone={currentZone}
                incidents={room.incidents}
                players={room.players}
                myId={myId}
                myWorkingOn={me?.workingOn}
                onWork={onWork}
                onOpenMission={handleOpenMission}
              />
            </div>
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

      <MissionModal
        incident={missionIncident}
        onClose={() => setMissionIncidentId(null)}
        onSolved={handleMissionSolved}
      />
    </div>
  );
}
