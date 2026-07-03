const ZONE_ICONS = {
  reactor: "🏭",
  generator: "⚡",
  electrical: "💡",
  containment: "🧪",
  security: "🚪",
  control: "🖥️",
};

export default function GameMap({ zones, incidents, players, myId, myName, blackout, avatarElRef }) {
  const others = players.filter((p) => p.connected && p.id !== myId);

  return (
    <div className="game-map">
      {zones.map((zone) => {
        const zoneIncidents = incidents.filter((i) => i.zone === zone.id);
        const isDark = blackout && zone.id !== "generator";
        return (
          <div
            key={zone.id}
            className={`map-zone ${zoneIncidents.length ? "alert" : ""} ${isDark ? "dark" : ""}`}
            style={{
              left: `${zone.x * 100}%`,
              top: `${zone.y * 100}%`,
              width: `${zone.r * 2 * 100}%`,
              paddingBottom: `${zone.r * 2 * 100}%`,
            }}
          >
            <div className="map-zone-inner">
              <span className="map-zone-icon">{ZONE_ICONS[zone.id] || "🔧"}</span>
              <span className="map-zone-name">{isDark ? "???" : zone.name}</span>
              {zoneIncidents.length > 0 && (
                <span className="map-zone-badge">{zoneIncidents.length}</span>
              )}
            </div>
          </div>
        );
      })}

      {others.map((p) => (
        <div
          key={p.id}
          className="map-avatar other"
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
        >
          <span className="map-avatar-icon">👷</span>
          <span className="map-avatar-name">{p.name}</span>
        </div>
      ))}

      <div ref={avatarElRef} className="map-avatar me">
        <span className="map-avatar-icon">🧑‍🔧</span>
        <span className="map-avatar-name">{myName}</span>
      </div>
    </div>
  );
}
