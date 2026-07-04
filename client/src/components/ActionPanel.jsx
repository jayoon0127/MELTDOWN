export default function ActionPanel({ zone, incidents, players, myId, myWorkingOn, onWork, onOpenMission }) {
  if (!zone) return null;
  const zoneIncidents = incidents.filter((i) => i.zone === zone.id);
  if (zoneIncidents.length === 0) {
    return (
      <div className="action-panel idle">
        <span>{zone.name} · 이상 없음</span>
      </div>
    );
  }

  const zoneLocked = zoneIncidents.some((i) => i.locksZone);

  return (
    <div className="action-panel">
      {zoneIncidents.slice(0, 2).map((inc) => {
        const workers = players.filter((p) => p.workingOn === inc.id);
        const isWorking = myWorkingOn === inc.id;
        const locked = zoneLocked && !inc.locksZone;
        return (
          <div key={inc.id} className="action-card">
            <div className="action-card-info">
              <span className="action-icon">{inc.icon}</span>
              <span className="action-name">{inc.name}</span>
              <div className="incident-progress">
                <div className="incident-progress-fill" style={{ width: `${inc.progress}%` }} />
              </div>
              <span className="action-workers">
                {workers.length > 0
                  ? workers.map((w) => (w.id === myId ? "나" : w.name)).join(", ")
                  : "대기 중"}
              </span>
            </div>
            <div className="action-card-buttons">
              <button
                className={isWorking ? "work-btn active" : "work-btn"}
                disabled={locked}
                onClick={() => onWork(isWorking ? null : inc.id)}
              >
                {locked ? "잠김" : isWorking ? "그만하기" : "작업하기"}
              </button>
              {inc.minigame && !locked && (
                <button className="mission-btn" onClick={() => onOpenMission(inc)}>
                  정밀 작업
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
