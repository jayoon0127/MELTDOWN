import { nanoid } from "nanoid";
import {
  TICK_MS,
  GAME_DURATION_SEC,
  INITIAL_STATS,
  LOSE_CONDITIONS,
  INCIDENT_LIST,
  INCIDENT_TYPES,
  BLACKOUT_SUSTAIN_LIMIT_SEC,
  ZONES,
  PLAYER_SPAWN,
  ITEM_LIST,
  ITEM_TYPES,
  ITEM_PICKUP_RADIUS,
  MINIGAME_BOOST_EFFORT,
  MINIGAME_COOLDOWN_SEC,
  HAZARD_TYPES,
  HAZARD_LIFETIME_SEC,
  HUNGER_THIRST_DECAY_PER_SEC,
  CONSUMABLE_RESTORE_AMOUNT,
  WEAKENED_WORK_MULTIPLIER,
} from "./constants.js";

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Same radius-based containment the client uses to decide "which zone am I
// standing in" (see useMovement.js's findZone), kept in sync here so item
// pickup/use eligibility matches what the player actually sees highlighted.
function zoneAt(x, y) {
  for (const zone of Object.values(ZONES)) {
    if (Math.hypot(x - zone.x, y - zone.y) <= zone.r) return zone;
  }
  return null;
}

// Work throughput (effort points/sec) scales with number of players
// contributing, but with diminishing returns so a single player
// can never keep up once things stack up.
function workRate(workerCount) {
  if (workerCount <= 0) return 0;
  return 4 + 4.5 * (workerCount - 1);
}

export class Room {
  constructor(code, hostId) {
    this.code = code;
    this.hostId = hostId;
    this.isPublic = false;
    this.voiceParticipants = new Set();
    this.players = new Map(); // id -> { id, name, workingOn: incidentId|null, connected }
    this.status = "lobby"; // lobby | playing | won | lost
    this.stats = { ...INITIAL_STATS };
    this.incidents = new Map(); // id -> incident instance
    this.items = new Map(); // id -> { id, typeId, carriedBy, zoneId, x, y }
    this.hazards = new Map(); // id -> { id, typeId, x, y, createdAt }
    this.elapsed = 0;
    this.timeRemaining = GAME_DURATION_SEC;
    this.blackoutTimer = 0;
    this.nextSpawnIn = 8;
    this.loseReason = null;
    this.chat = [];
    this.tickHandle = null;
  }

  get playerList() {
    return [...this.players.values()];
  }

  addPlayer(id, name) {
    if (this.players.size >= MAX_PLAYERS) return { error: "방이 가득 찼습니다." };
    const jitter = () => (Math.random() - 0.5) * 0.08;
    this.players.set(id, {
      id,
      name,
      workingOn: null,
      connected: true,
      x: clamp(PLAYER_SPAWN.x + jitter(), 0.04, 0.96),
      y: clamp(PLAYER_SPAWN.y + jitter(), 0.04, 0.96),
      hunger: 100,
      thirst: 100,
    });
    if (!this.hostId) this.hostId = id;
    return { ok: true };
  }

  movePlayer(id, x, y) {
    const player = this.players.get(id);
    if (!player) return;
    if (typeof x !== "number" || typeof y !== "number" || Number.isNaN(x) || Number.isNaN(y)) return;
    player.x = clamp(x, 0.02, 0.98);
    player.y = clamp(y, 0.02, 0.98);
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (p) p.connected = false;
    // release any incident they were working
    this.setWorking(id, null);
    if (this.hostId === id) {
      const next = this.playerList.find((pl) => pl.connected && pl.id !== id);
      this.hostId = next ? next.id : this.hostId;
    }
  }

  isEmpty() {
    return this.playerList.every((p) => !p.connected);
  }

  setWorking(playerId, incidentId) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.workingOn = incidentId || null;
  }

  // Solving an incident's detailed mission minigame (see client's
  // NodeConnectMinigame) grants a fixed, server-decided progress bump on
  // top of normal passive work — the client never gets to say how much.
  boostIncident(playerId, incidentId) {
    const player = this.players.get(playerId);
    const inc = this.incidents.get(incidentId);
    if (!player || !inc || player.workingOn !== incidentId) return;
    const type = INCIDENT_TYPES[inc.typeId];
    if (!type.minigame) return;
    if (inc.lastBoostAt != null && this.elapsed - inc.lastBoostAt < MINIGAME_COOLDOWN_SEC) return;
    inc.lastBoostAt = this.elapsed;
    inc.progress += MINIGAME_BOOST_EFFORT;
    if (inc.progress >= inc.effort) {
      this.incidents.delete(inc.id);
      for (const p of this.playerList) {
        if (p.workingOn === inc.id) p.workingOn = null;
      }
    }
  }

  carriedItem(playerId) {
    return [...this.items.values()].find((it) => it.carriedBy === playerId) || null;
  }

  // Every item has exactly one home location: either a room (homeZone) or a
  // fixed hallway spot (homePos, used by the break-area snacks).
  spawnItemInstance(type) {
    const id = nanoid(6);
    const item = { id, typeId: type.id, carriedBy: null, zoneId: null, x: null, y: null };
    if (type.homeZone) {
      item.zoneId = type.homeZone;
    } else if (type.homePos) {
      item.x = type.homePos.x;
      item.y = type.homePos.y;
    }
    this.items.set(id, item);
    return item;
  }

  pickupItem(playerId, itemId) {
    const player = this.players.get(playerId);
    const item = this.items.get(itemId);
    if (!player || !item || item.carriedBy) return;
    if (this.carriedItem(playerId)) return; // one item at a time
    if (item.zoneId) {
      if (zoneAt(player.x, player.y)?.id !== item.zoneId) return;
    } else {
      if (Math.hypot(player.x - item.x, player.y - item.y) > ITEM_PICKUP_RADIUS) return;
    }
    item.carriedBy = playerId;
    item.zoneId = null;
    item.x = null;
    item.y = null;
  }

  dropItem(playerId) {
    const item = this.carriedItem(playerId);
    const player = this.players.get(playerId);
    if (!item || !player) return;
    item.carriedBy = null;
    const zone = zoneAt(player.x, player.y);
    if (zone) {
      item.zoneId = zone.id;
    } else {
      item.x = player.x;
      item.y = player.y;
    }
  }

  useItem(playerId) {
    const item = this.carriedItem(playerId);
    const player = this.players.get(playerId);
    if (!item || !player) return;
    const type = ITEM_TYPES[item.typeId];

    if (type.kind === "consumable") {
      player[type.restores] = clamp(player[type.restores] + CONSUMABLE_RESTORE_AMOUNT, 0, 100);
      if (type.leavesHazard) {
        const hazardId = nanoid(6);
        this.hazards.set(hazardId, {
          id: hazardId,
          typeId: type.leavesHazard,
          x: player.x,
          y: player.y,
          createdAt: this.elapsed,
        });
      }
      this.items.delete(item.id);
      this.spawnItemInstance(type);
      return;
    }

    const zone = zoneAt(player.x, player.y);
    if (!zone) return;
    const inc = [...this.incidents.values()].find(
      (i) => i.zone === zone.id && type.usableOn.includes(i.typeId)
    );
    if (!inc) return;
    this.incidents.delete(inc.id);
    for (const p of this.playerList) {
      if (p.workingOn === inc.id) p.workingOn = null;
    }
    // Consumed on use; a fresh one respawns at its home spot so the tool
    // stays available for the next fire.
    this.items.delete(item.id);
    this.spawnItemInstance(type);
  }

  addChat(playerId, text) {
    const player = this.players.get(playerId);
    const name = player ? player.name : "???";
    const entry = { id: nanoid(6), name, text: String(text).slice(0, 300), ts: Date.now() };
    this.chat.push(entry);
    if (this.chat.length > 100) this.chat.shift();
    return entry;
  }

  start(onUpdate, onEnd) {
    if (this.status === "playing") return;
    this.status = "playing";
    this.stats = { ...INITIAL_STATS };
    this.incidents.clear();
    this.items.clear();
    for (const type of ITEM_LIST) this.spawnItemInstance(type);
    this.hazards.clear();
    this.elapsed = 0;
    this.timeRemaining = GAME_DURATION_SEC;
    this.blackoutTimer = 0;
    this.nextSpawnIn = 8;
    this.loseReason = null;
    for (const p of this.playerList) {
      p.workingOn = null;
      p.hunger = 100;
      p.thirst = 100;
    }

    this.tickHandle = setInterval(() => {
      this.tick();
      onUpdate(this.serialize());
      if (this.status !== "playing") {
        clearInterval(this.tickHandle);
        this.tickHandle = null;
        onEnd(this.serialize());
      }
    }, TICK_MS);
  }

  stop() {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  difficultyFactor() {
    // 1.0 at start, up to ~3.6 by end of round
    return 1 + 2.6 * clamp(this.elapsed / GAME_DURATION_SEC, 0, 1);
  }

  spawnIntervalSec() {
    const t = clamp(this.elapsed / GAME_DURATION_SEC, 0, 1);
    const base = 18 - 14 * t; // 18s -> 4s
    return Math.max(3, base) * (0.75 + Math.random() * 0.5);
  }

  maxActiveIncidents() {
    return clamp(1 + Math.floor(this.elapsed / 35), 1, 8);
  }

  zoneIsBlocked(zoneId) {
    for (const inc of this.incidents.values()) {
      if (inc.zone === zoneId && INCIDENT_TYPES[inc.typeId].locksZone) return true;
    }
    return false;
  }

  spawnIncident() {
    const activeTypeIds = new Set([...this.incidents.values()].map((i) => i.typeId));
    const candidates = INCIDENT_LIST.filter((t) => !activeTypeIds.has(t.id));
    const pool = candidates.length > 0 ? candidates : INCIDENT_LIST;
    const type = pool[Math.floor(Math.random() * pool.length)];
    const id = nanoid(8);
    this.incidents.set(id, {
      id,
      typeId: type.id,
      zone: type.zone,
      progress: 0,
      effort: type.effort,
      startedAt: this.elapsed,
      spread: false,
      lastBoostAt: null,
    });
  }

  tick() {
    const dtSec = TICK_MS / 1000;
    this.elapsed += dtSec;
    this.timeRemaining = Math.max(0, GAME_DURATION_SEC - this.elapsed);

    // Hunger/thirst drain continuously; a player running on empty
    // contributes less work (see workerCounts below) until they eat/drink.
    for (const p of this.playerList) {
      if (!p.connected) continue;
      p.hunger = clamp(p.hunger - HUNGER_THIRST_DECAY_PER_SEC * dtSec, 0, 100);
      p.thirst = clamp(p.thirst - HUNGER_THIRST_DECAY_PER_SEC * dtSec, 0, 100);
    }

    // Expire stale hazards (banana peels someone never cleaned up).
    for (const [id, hz] of [...this.hazards.entries()]) {
      if (this.elapsed - hz.createdAt > HAZARD_LIFETIME_SEC) this.hazards.delete(id);
    }

    // Count workers per incident, weighted down for anyone weakened by
    // hunger or thirst.
    const workerCounts = new Map();
    for (const p of this.playerList) {
      if (!p.connected || !p.workingOn) continue;
      if (!this.incidents.has(p.workingOn)) continue;
      const weight = p.hunger <= 0 || p.thirst <= 0 ? WEAKENED_WORK_MULTIPLIER : 1;
      workerCounts.set(p.workingOn, (workerCounts.get(p.workingOn) || 0) + weight);
    }

    const blackoutActive = [...this.incidents.values()].some((i) => i.typeId === "BLACKOUT");
    const radiationActive = [...this.incidents.values()].some((i) => i.typeId === "RADIATION_LEAK");
    const diff = this.difficultyFactor();

    // Resolve progress + stat effects
    for (const inc of [...this.incidents.values()]) {
      const type = INCIDENT_TYPES[inc.typeId];
      const workers = workerCounts.get(inc.id) || 0;
      let rate = workRate(workers);
      if (blackoutActive && inc.typeId !== "BLACKOUT") rate *= 0.5;
      if (radiationActive && inc.zone === "containment" && inc.typeId !== "RADIATION_LEAK") rate *= 0.6;
      inc.progress += rate * dtSec;

      if (inc.progress >= inc.effort) {
        this.incidents.delete(inc.id);
        for (const p of this.playerList) {
          if (p.workingOn === inc.id) p.workingOn = null;
        }
        continue;
      }

      for (const [statKey, perSec] of Object.entries(type.effect)) {
        this.stats[statKey] = clamp(
          this.stats[statKey] + perSec * diff * dtSec,
          0,
          100
        );
      }

      if (type.spreadAfterSec && !inc.spread && this.elapsed - inc.startedAt > type.spreadAfterSec) {
        inc.spread = true;
        this.stats.integrity = clamp(this.stats.integrity - 8, 0, 100);
      }
    }

    // Spawn new incidents
    this.nextSpawnIn -= dtSec;
    if (this.nextSpawnIn <= 0 && this.incidents.size < this.maxActiveIncidents()) {
      this.spawnIncident();
      this.nextSpawnIn = this.spawnIntervalSec();
    }

    // Blackout sustain tracking
    if (this.stats.power <= 0) {
      this.blackoutTimer += dtSec;
    } else {
      this.blackoutTimer = 0;
    }

    this.checkEnd();
  }

  checkEnd() {
    for (const [key, cond] of Object.entries(LOSE_CONDITIONS)) {
      const v = this.stats[key];
      if (cond.op === ">=" && v >= cond.value) {
        this.endGame("lost", cond.reason);
        return;
      }
      if (cond.op === "<=" && v <= cond.value) {
        this.endGame("lost", cond.reason);
        return;
      }
    }
    if (this.blackoutTimer >= BLACKOUT_SUSTAIN_LIMIT_SEC) {
      this.endGame("lost", "발전소 전체 정전이 지속되어 통제 불능 상태가 되었습니다.");
      return;
    }
    if (this.timeRemaining <= 0) {
      this.endGame("won", "제한 시간을 버텨냈습니다!");
      return;
    }
  }

  endGame(status, reason) {
    this.status = status;
    this.loseReason = reason;
  }

  serialize() {
    return {
      code: this.code,
      hostId: this.hostId,
      isPublic: this.isPublic,
      status: this.status,
      stats: this.stats,
      elapsed: Math.floor(this.elapsed),
      timeRemaining: Math.ceil(this.timeRemaining),
      loseReason: this.loseReason,
      players: this.playerList.map((p) => ({
        id: p.id,
        name: p.name,
        workingOn: p.workingOn,
        connected: p.connected,
        x: p.x,
        y: p.y,
        hunger: p.hunger,
        thirst: p.thirst,
      })),
      incidents: [...this.incidents.values()].map((inc) => {
        const type = INCIDENT_TYPES[inc.typeId];
        return {
          id: inc.id,
          typeId: inc.typeId,
          name: type.name,
          icon: type.icon,
          zone: inc.zone,
          progress: Math.min(100, Math.round((inc.progress / inc.effort) * 100)),
          obscuresStats: !!type.obscuresStats,
          locksZone: !!type.locksZone,
          minigame: type.minigame || null,
        };
      }),
      items: [...this.items.values()].map((it) => {
        const type = ITEM_TYPES[it.typeId];
        return {
          id: it.id,
          typeId: it.typeId,
          name: type.name,
          icon: type.icon,
          kind: type.kind,
          usableOn: type.usableOn || null,
          restores: type.restores || null,
          carriedBy: it.carriedBy,
          zoneId: it.zoneId,
          x: it.x,
          y: it.y,
        };
      }),
      hazards: [...this.hazards.values()].map((hz) => {
        const type = HAZARD_TYPES[hz.typeId];
        return { id: hz.id, typeId: hz.typeId, name: type.name, icon: type.icon, x: hz.x, y: hz.y };
      }),
      zones: Object.values(ZONES),
      chat: this.chat,
    };
  }
}
