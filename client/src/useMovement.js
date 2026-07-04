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
      // Cap total catch-up at 0.25s (e.g. after the tab was backgrounded)
      // so movement doesn't leap on resume, but otherwise use the real
      // elapsed time in full — a slow frame should feel the same as two
      // fast ones, not silently lose distance.
      const totalDt = Math.min(0.25, (ts - lastTsRef.current) / 1000);
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
        // Sub-step in small chunks so collision resolution runs often
        // enough that a big totalDt (a slow frame) can't let the player
        // tunnel clean through a thin wall in one jump.
        const MAX_STEP = 0.05;
        let remaining = totalDt;
        let next = posRef.current;
        while (remaining > 0) {
          const step = Math.min(MAX_STEP, remaining);
          next = {
            x: clamp(next.x + dx * SPEED * step, 0.02, 0.98),
            y: clamp(next.y + dy * SPEED * step, 0.02, 0.98),
          };
          if (resolveCollision) next = resolveCollision(next);
          remaining -= step;
        }
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
