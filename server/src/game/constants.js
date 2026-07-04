export const TICK_MS = 500;

export const GAME_DURATION_SEC = 5 * 60; // 5 minute prototype round

// x/y are normalized (0-1) positions on the game map, r is the interaction
// radius a player's avatar must be within to work on incidents in that zone.
// Rows/columns are spaced wide enough that the 3D client can build actual
// walled rooms (see client/src/components/three/RoomShell.jsx) around each
// one without adjacent rooms' walls overlapping, connected by a shared
// hallway running through the middle of the map.
export const ZONE_RADIUS = 0.1;

export const ZONES = {
  reactor: { id: "reactor", name: "원자로 노심", x: 0.15, y: 0.22, r: ZONE_RADIUS },
  generator: { id: "generator", name: "발전기실", x: 0.5, y: 0.22, r: ZONE_RADIUS },
  electrical: { id: "electrical", name: "전기실", x: 0.85, y: 0.22, r: ZONE_RADIUS },
  containment: { id: "containment", name: "격리 구역", x: 0.15, y: 0.66, r: ZONE_RADIUS },
  security: { id: "security", name: "보안실", x: 0.5, y: 0.66, r: ZONE_RADIUS },
  control: { id: "control", name: "제어실", x: 0.85, y: 0.66, r: ZONE_RADIUS },
};

export const PLAYER_SPAWN = { x: 0.5, y: 0.44 };
export const PLAYER_MOVE_SPEED = 0.32; // normalized units per second

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
  WIRING_SHORT: {
    id: "WIRING_SHORT",
    name: "배선 합선",
    icon: "🔌",
    zone: "electrical",
    effect: { integrity: -0.7 },
    effort: 30,
    // Tells the client to offer a detailed puzzle (see client's
    // NodeConnectMinigame) instead of just the passive progress bar —
    // solving it grants an instant MINIGAME_BOOST_EFFORT bonus on top of
    // normal work.
    minigame: "nodes",
  },
};

export const INCIDENT_LIST = Object.values(INCIDENT_TYPES);

// Instant progress bonus for solving an incident's detailed mission
// minigame once, gated by MINIGAME_COOLDOWN_SEC so it tops up work rather
// than replacing it.
export const MINIGAME_BOOST_EFFORT = 14;
export const MINIGAME_COOLDOWN_SEC = 6;

// Physical items players can carry between rooms and use on a matching
// incident. homeZone is where a fresh one spawns/respawns; usableOn lists
// the incident type ids it resolves.
export const ITEM_TYPES = {
  FIRE_EXTINGUISHER: {
    id: "FIRE_EXTINGUISHER",
    name: "소화기",
    icon: "🧯",
    homeZone: "electrical",
    usableOn: ["FIRE"],
  },
};

export const ITEM_LIST = Object.values(ITEM_TYPES);

// Normalized-unit radius for picking up an item that's been dropped/thrown
// on the ground outside of any zone (in the hallway).
export const ITEM_PICKUP_RADIUS = 0.06;
