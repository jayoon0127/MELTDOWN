import { STAT_META, statLevel } from "../statMeta";

export default function StatGauge({ statKey, value, obscured }) {
  const meta = STAT_META[statKey];
  const level = statLevel(statKey, value);
  const displayValue = obscured ? "??" : Math.round(value);
  const fillPct = meta.danger === "low" ? value : value;

  return (
    <div className={`stat-gauge stat-${level}`}>
      <div className="stat-label">
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
        <span className="stat-value">{displayValue}</span>
      </div>
      <div className="stat-bar">
        <div
          className="stat-bar-fill"
          style={{ width: `${obscured ? 50 + Math.sin(Date.now() / 300) * 20 : fillPct}%` }}
        />
      </div>
    </div>
  );
}
