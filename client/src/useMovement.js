import { useCallback, useEffect, useRef } from "react";
import { socket } from "./socket";

const SPEED = 0.32; // normalized units/sec, mirrors server PLAYER_MOVE_SPEED (cosmetic only, not enforced)
const EMIT_INTERVAL_MS = 90;
const KEYS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
};

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Drives the local player's avatar: combines virtual-joystick input and
// keyboard (WASD/arrows) into one vector, integrates position every frame
// (written straight to the avatar ref via applyPosition to skip React
// re-renders), and throttles the network-facing position updates +
// current-zone lookups. applyPosition(el, {x, y}) decides how a normalized
// 0-1 position maps onto whatever `el` actually is (a DOM node's style, a
// Three.js Object3D's position, etc). resolveCollision(pos) => pos is an
// optional pass that pushes a candidate position back out of solid
// geometry (walls); omit it for a scene with nothing to bump into.
export function useMovement({ initialPos, zones, onZoneChange, applyPosition, resolveCollision }) {
  const posRef = useRef(initialPos);
  const avatarElRef = useRef(null);
  const joystickVecRef = useRef({ x: 0, y: 0 });
  const keyVecRef = useRef({ x: 0, y: 0 });
  const pressedKeysRef = useRef(new Set());
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const lastEmitRef = useRef(0);
  const lastZoneRef = useRef(null);

  const setJoystickVector = useCallback((x, y) => {
    joystickVecRef.current = { x, y };
  }, []);

  const applyAvatarStyle = useCallback(() => {
    const el = avatarElRef.current;
    if (!el) return;
    applyPosition(el, posRef.current);
  }, [applyPosition]);

  useEffect(() => {
    applyAvatarStyle();
  }, [applyAvatarStyle]);

  useEffect(() => {
    function recalcKeyVector() {
      let x = 0;
      let y = 0;
      for (const key of pressedKeysRef.current) {
        const dir = KEYS[key];
        if (!dir) continue;
        x += dir[0];
        y += dir[1];
      }
      const mag = Math.hypot(x, y);
      keyVecRef.current = mag > 1 ? { x: x / mag, y: y / mag } : { x, y };
    }
    function onKeyDown(e) {
      if (!KEYS[e.key]) return;
      pressedKeysRef.current.add(e.key);
      recalcKeyVector();
    }
    function onKeyUp(e) {
      pressedKeysRef.current.delete(e.key);
      recalcKeyVector();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    function findZone(x, y) {
      for (const zone of zones) {
        const d = Math.hypot(x - zone.x, y - zone.y);
        if (d <= zone.r) return zone.id;
      }
      return null;
    }

    function tick(ts) {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      // Clamped tight: at SPEED=0.32/sec, 0.05s is ~0.016 normalized units
      // (0.16 world units) max per frame, comfortably under wall thickness
      // so a slow frame can't tunnel the player clean through a wall.
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const jv = joystickVecRef.current;
      const kv = keyVecRef.current;
      let dx = jv.x + kv.x;
      let dy = jv.y + kv.y;
      const mag = Math.hypot(dx, dy);
      if (mag > 1) {
        dx /= mag;
        dy /= mag;
      }

      if (dx !== 0 || dy !== 0) {
        let next = {
          x: clamp(posRef.current.x + dx * SPEED * dt, 0.02, 0.98),
          y: clamp(posRef.current.y + dy * SPEED * dt, 0.02, 0.98),
        };
        if (resolveCollision) next = resolveCollision(next);
        posRef.current = next;
        applyAvatarStyle();
        if (import.meta.env.DEV) window.__meltdownPos = posRef.current;
      }

      if (ts - lastEmitRef.current > EMIT_INTERVAL_MS) {
        lastEmitRef.current = ts;
        socket.emit("player:move", posRef.current);
        const zoneId = findZone(posRef.current.x, posRef.current.y);
        if (zoneId !== lastZoneRef.current) {
          lastZoneRef.current = zoneId;
          onZoneChange(zoneId);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    if (import.meta.env.DEV) {
      window.__meltdownTeleport = (x, y) => {
        posRef.current = { x, y };
        applyAvatarStyle();
        window.__meltdownPos = posRef.current;
      };
    }
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  return { avatarElRef, setJoystickVector };
}
