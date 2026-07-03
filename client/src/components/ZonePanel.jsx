const ZONE_ICONS = {
  reactor: "🏭",
  generator: "⚡",
  electrical: "💡",
  containment: "🧪",
  security: "🚪",
  control: "🖥️",
};

export default function ZonePanel({ zone, incidents, players, myId, myWorkingOn, blackout, onWork }) {
  const zoneIncidents = incidents.filter((i) => i.zone === zone.id);
  const zoneLocked = zoneIncidents.some((i) => i.locksZone);
  const isDark = blackout && zone.id !== "generator";

  const workersFor = (incidentId) => players.filter((p) => p.workingOn === incidentId);

  return (
    <div className={`zone-panel ${isDark ? "zone-dark" : ""} ${zoneIncidents.length ? "zone-alert" : ""}`}>
      <div className="zone-header">
        <span className="zone-icon">{ZONE_ICONS[zone.id] || "🔧"}</span>
        <span className="zone-name">{zone.name}</span>
        {isDark && <span className="zone-dark-badge">정전 중</span>}
      </div>

      {zoneIncidents.length === 0 && <p className="zone-idle">이상 없음</p>}

      {zoneIncidents.map((inc) => {
        const workers = workersFor(inc.id);
        const isWorking = myWorkingOn === inc.id;
        const locked = zoneLocked && !inc.locksZone;
        return (
          <div key={inc.id} className="incident-card">
            <div className="incident-top">
              <span className="incident-icon">{inc.icon}</span>
              <span className="incident-name">
                {isDark ? "??? (정전으로 식별 불가)" : inc.name}
              </span>
            </div>
            <div className="incident-progress">
              <div
                className="incident-progress-fill"
                style={{ width: `${inc.progress}%` }}
              />
            </div>
            <div className="incident-bottom">
              <span className="workers">
                {workers.length > 0
                  ? `작업 중: ${workers.map((w) => (w.id === myId ? "나" : w.name)).join(", ")}`
                  : "아무도 작업 중이지 않음"}
              </span>
              <button
                className={isWorking ? "work-btn active" : "work-btn"}
                disabled={locked}
                onClick={() => onWork(isWorking ? null : inc.id)}
              >
                {locked ? "잠김" : isWorking ? "그만하기" : "작업하기"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
