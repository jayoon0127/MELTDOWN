export const STAT_META = {
  temperature: { label: "노심 온도", icon: "🌡️", danger: "high" },
  pressure: { label: "증기 압력", icon: "🌀", danger: "high" },
  radiation: { label: "방사능", icon: "☢️", danger: "high" },
  power: { label: "전력", icon: "🔋", danger: "low" },
  integrity: { label: "설비 내구도", icon: "🏗️", danger: "low" },
};

export function statLevel(key, value) {
  const meta = STAT_META[key];
  const risky = meta.danger === "high" ? value >= 75 : value <= 25;
  const warn = meta.danger === "high" ? value >= 50 : value <= 50;
  if (risky) return "critical";
  if (warn) return "warning";
  return "safe";
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
