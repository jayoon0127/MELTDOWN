// Generates wall segment descriptors shared by the renderers (RoomShell,
// BuildingShell) and the collision system (collision.js), so the geometry
// you can see is exactly the geometry you can bump into.
export const WALL_HEIGHT = 2.3;
export const WALL_THICKNESS = 0.14;
export const DOOR_WIDTH = 1.1;

export const BUILDING_WALL_HEIGHT = 2.6;
export const BUILDING_WALL_THICKNESS = 0.2;

// Local-space wall segments for a room with a doorway gap on one side.
// Each segment: { length, cx, cz, rotationY } — rotationY 0 means the
// segment runs along local X, Math.PI/2 means it runs along local Z.
export function getRoomWallSegments(halfWidth, halfDepth, doorSide) {
  const segX = (halfWidth * 2 - DOOR_WIDTH) / 2;
  const segZ = (halfDepth * 2 - DOOR_WIDTH) / 2;
  const segments = [];

  function addXWall(cz, isDoor) {
    if (isDoor) {
      segments.push({ length: segX, cx: -(DOOR_WIDTH / 2 + segX / 2), cz, rotationY: 0 });
      segments.push({ length: segX, cx: DOOR_WIDTH / 2 + segX / 2, cz, rotationY: 0 });
    } else {
      segments.push({ length: halfWidth * 2, cx: 0, cz, rotationY: 0 });
    }
  }
  function addZWall(cx, isDoor) {
    if (isDoor) {
      segments.push({ length: segZ, cx, cz: -(DOOR_WIDTH / 2 + segZ / 2), rotationY: Math.PI / 2 });
      segments.push({ length: segZ, cx, cz: DOOR_WIDTH / 2 + segZ / 2, rotationY: Math.PI / 2 });
    } else {
      segments.push({ length: halfDepth * 2, cx, cz: 0, rotationY: Math.PI / 2 });
    }
  }

  addXWall(-halfDepth, doorSide === "north");
  addXWall(halfDepth, doorSide === "south");
  addZWall(-halfWidth, doorSide === "west");
  addZWall(halfWidth, doorSide === "east");

  return segments.filter((s) => s.length > 0.05);
}

// Local-space wall segments for the four outer perimeter walls (no door).
export function getBuildingWallSegments(buildingHalf) {
  const span = buildingHalf * 2;
  return [
    { length: span, cx: 0, cz: -buildingHalf, rotationY: 0 },
    { length: span, cx: 0, cz: buildingHalf, rotationY: 0 },
    { length: span, cx: -buildingHalf, cz: 0, rotationY: Math.PI / 2 },
    { length: span, cx: buildingHalf, cz: 0, rotationY: Math.PI / 2 },
  ];
}
