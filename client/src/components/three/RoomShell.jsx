import { WALL_HEIGHT, WALL_THICKNESS, getRoomWallSegments } from "./wallLayout";

// Four walls around a zone with a doorway gap on one side, facing the
// shared hallway that runs through the middle of the map. Rooms are sized
// in server/src/game/constants.js's zone spacing so adjacent rooms never
// overlap. Wall geometry comes from wallLayout.js so this always matches
// the collider segments the player actually bumps into.
export default function RoomShell({ halfWidth, halfDepth, doorSide, color = "#3a5578" }) {
  const y = WALL_HEIGHT / 2;
  const segments = getRoomWallSegments(halfWidth, halfDepth, doorSide);

  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.cx, y, s.cz]} rotation={[0, s.rotationY, 0]}>
          <boxGeometry args={[s.length, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
    </group>
  );
}
