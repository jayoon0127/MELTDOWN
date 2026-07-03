export const TICK_MS = 500;

export const GAME_DURATION_SEC = 5 * 60; // 5 minute prototype round

export const ZONES = {
  reactor: { id: "reactor", name: "원자로 노심" },
  generator: { id: "generator", name: "발전기실" },
  electrical: { id: "electrical", name: "전기실" },
  containment: { id: "containment", name: "격리 구역" },
  security: { id: "security", name: "보안실" },
  control: { id: "control", name: "제어실" },
};

// stats are 0-100. power is inverted (0 = blackout). integrity 100 = healthy.
export const STAT_KEYS = ["temperature", "pressure", "radiation", "power", "integrity"];

export const INITIAL_STATS = {
  temperature: 25,
  pressure: 20,
  radiation: 10,
  power: 100,
  integrity: 100,
};

export const LOSE_CONDITIONS = {
  temperature: { op: ">=", value: 100, reason: "노심 용융이 발생했습니다." },
  pressure: { op: ">=", value: 100, reason: "원자로가 폭발했습니다." },
  radiation: { op: ">=", value: 100, reason: "방사능 수치가 한계를 초과했습니다." },
  integrity: { op: "<=", value: 0, reason: "주요 설비가 완전히 파괴되었습니다." },
};

export const BLACKOUT_SUSTAIN_LIMIT_SEC = 15;

// Incident type definitions.
// effect: stat deltas applied per tick while unresolved (before difficulty scaling)
export const INCIDENT_TYPES = {
  COOLANT_LOW: {
    id: "COOLANT_LOW",
    name: "냉각수 부족",
    icon: "💧",
    zone: "reactor",
    effect: { temperature: 1.2 },
    effort: 30,
  },
  PIPE_BURST: {
    id: "PIPE_BURST",
    name: "배관 파손",
    icon: "🔧",
    zone: "reactor",
    effect: { temperature: 0.6, integrity: -0.8 },
    effort: 26,
  },
  GENERATOR_FAIL: {
    id: "GENERATOR_FAIL",
    name: "발전기 고장",
    icon: "⚙️",
    zone: "generator",
    effect: { power: -1.5 },
    effort: 28,
  },
  BLACKOUT: {
    id: "BLACKOUT",
    name: "정전",
    icon: "🕯️",
    zone: "generator",
    effect: { power: -2 },
    effort: 24,
  },
  FIRE: {
    id: "FIRE",
    name: "화재",
    icon: "🔥",
    zone: "electrical",
    effect: { integrity: -1.4 },
    effort: 32,
    spreadAfterSec: 20,
  },
  PRESSURE_HIGH: {
    id: "PRESSURE_HIGH",
    name: "증기 압력 상승",
    icon: "🌡️",
    zone: "reactor",
    effect: { pressure: 1.4 },
    effort: 30,
  },
  RADIATION_LEAK: {
    id: "RADIATION_LEAK",
    name: "방사능 누출",
    icon: "☢️",
    zone: "containment",
    effect: { radiation: 1.3 },
    effort: 34,
    slowsWork: true,
  },
  SECURITY_LOCK: {
    id: "SECURITY_LOCK",
    name: "보안문 잠김",
    icon: "🔒",
    zone: "security",
    effect: {},
    effort: 18,
    locksZone: true,
  },
  SENSOR_GLITCH: {
    id: "SENSOR_GLITCH",
    name: "센서 오작동",
    icon: "📡",
    zone: "control",
    effect: {},
    effort: 20,
    obscuresStats: true,
  },
};

export const INCIDENT_LIST = Object.values(INCIDENT_TYPES);
