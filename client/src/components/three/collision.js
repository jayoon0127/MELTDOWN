import { toWorld, ROOM_HALF_WIDTH, ROOM_HALF_DEPTH, BUILDING_HALF, getZoneDoorSide } from "./worldMap";
import {
  WALL_THICKNESS,
  BUILDING_WALL_THICKNESS,
  getRoomWallSegments,
  getBuildingWallSegments,
} from "./wallLayout";

const PLAYER_RADIUS = 0.24;

function segmentToRect(seg, thickness, offsetX, offsetZ) {
  const halfLen = seg.length / 2;
  const halfThick = thickness / 2;
  if (seg.rotationY === 0) {
    return {
      minX: offsetX + seg.cx - halfLen,
      maxX: offsetX + seg.cx + halfLen,
      minZ: offsetZ + seg.cz - halfThick,
      maxZ: offsetZ + seg.cz + halfThick,
    };
  }
  return {
    minX: offsetX + seg.cx - halfThick,
    maxX: offsetX + seg.cx + halfThick,
    minZ: offsetZ + seg.cz - halfLen,
    maxZ: offsetZ + seg.cz + halfLen,
  };
}

// Builds the same wall rectangles RoomShell/BuildingShell render, as plain
// axis-aligned bounding boxes in world space, for collision purposes.
export function buildWallColliders(zones) {
  const rects = [];
  for (const zone of zones) {
    const [wx, , wz] = toWorld(zone.x, zone.y);
    const segs = getRoomWallSegments(ROOM_HALF_WIDTH, ROOM_HALF_DEPTH, getZoneDoorSide(zone));
    for (const seg of segs) rects.push(segmentToRect(seg, WALL_THICKNESS, wx, wz));
  }
  for (const seg of getBuildingWallSegments(BUILDING_HALF)) {
    rects.push(segmentToRect(seg, BUILDING_WALL_THICKNESS, 0, 0));
  }
  return rects;
}

// Pushes a circle of PLAYER_RADIUS centered at (x, z) out of any
// overlapping wall rectangle. Checks all rects every call since there are
// only a few dozen of them — cheap enough to run every movement frame.
export function resolveWallCollision(x, z, rects) {
  let px = x;
  let pz = z;
  for (const r of rects) {
    const cx = Math.max(r.minX, Math.min(px, r.maxX));
    const cz = Math.max(r.minZ, Math.min(pz, r.maxZ));
    const dx = px - cx;
    const dz = pz - cz;
    const distSq = dx * dx + dz * dz;
    if (distSq >= PLAYER_RADIUS * PLAYER_RADIUS) continue;

    const dist = Math.sqrt(distSq);
    if (dist > 1e-5) {
      const push = PLAYER_RADIUS - dist;
      px += (dx / dist) * push;
      pz += (dz / dist) * push;
    } else {
      // Center sits exactly on/inside the rect: push out along whichever
      // axis has the least overlap.
      const overlapX = Math.min(px - r.minX, r.maxX - px);
      const overlapZ = Math.min(pz - r.minZ, r.maxZ - pz);
      if (overlapX < overlapZ) {
        px += px < (r.minX + r.maxX) / 2 ? -PLAYER_RADIUS : PLAYER_RADIUS;
      } else {
        pz += pz < (r.minZ + r.maxZ) / 2 ? -PLAYER_RADIUS : PLAYER_RADIUS;
      }
    }
  }
  return { x: px, z: pz };
}
