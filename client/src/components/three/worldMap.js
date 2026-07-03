// Shared normalized-(0-1) <-> 3D-world coordinate mapping so the scene,
// the movement hook, and the zone hit-test all agree on the same layout.
export const WORLD_SIZE = 10;

// Matches the zone spacing in server/src/game/constants.js: 3 columns
// 3.5 units apart, 2 rows 4.4 units apart. Room half-extents are sized to
// leave a clear hallway between rooms in every direction.
export const ROOM_HALF_WIDTH = 1.4;
export const ROOM_HALF_DEPTH = 1.3;
export const BUILDING_HALF = 5.3;
export const CORRIDOR_Z_MIN = -1.6;
export const CORRIDOR_Z_MAX = 1.8;

export function toWorld(x, y) {
  return [(x - 0.5) * WORLD_SIZE, 0, (y - 0.5) * WORLD_SIZE];
}

// Passed into useMovement as `applyPosition` — writes the local player's
// normalized position onto their avatar's Three.js group each frame.
export function applyWorldPosition(object3D, pos) {
  const [wx, , wz] = toWorld(pos.x, pos.y);
  object3D.position.set(wx, 0, wz);
}
