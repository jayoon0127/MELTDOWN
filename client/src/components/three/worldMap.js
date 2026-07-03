// Shared normalized-(0-1) <-> 3D-world coordinate mapping so the scene,
// the movement hook, and the zone hit-test all agree on the same layout.
export const WORLD_SIZE = 10;

export function toWorld(x, y) {
  return [(x - 0.5) * WORLD_SIZE, 0, (y - 0.5) * WORLD_SIZE];
}

// Passed into useMovement as `applyPosition` — writes the local player's
// normalized position onto their avatar's Three.js group each frame.
export function applyWorldPosition(object3D, pos) {
  const [wx, , wz] = toWorld(pos.x, pos.y);
  object3D.position.set(wx, 0, wz);
}
