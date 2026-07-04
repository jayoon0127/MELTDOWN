import NodeConnectMinigame from "./NodeConnectMinigame";

// Registry of detailed mission UIs, keyed by the incident's `minigame`
// field (server/src/game/constants.js). Add an entry here for each new
// minigame type a future incident wants to offer.
const MINIGAMES = {
  nodes: NodeConnectMinigame,
};

export default function MissionModal({ incident, onClose, onSolved }) {
  if (!incident) return null;
  const Minigame = MINIGAMES[incident.minigame];
  if (!Minigame) return null;

  return (
    <div className="mission-overlay" onClick={onClose}>
      <div className="mission-card" onClick={(e) => e.stopPropagation()}>
        <div className="mission-header">
          <span>
            {incident.icon} {incident.name} · 정밀 조치
          </span>
          <button className="mission-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <Minigame onComplete={onSolved} />
      </div>
    </div>
  );
}
