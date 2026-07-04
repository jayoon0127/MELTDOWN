import { BUILDING_HALF, CORRIDOR_Z_MIN, CORRIDOR_Z_MAX } from "./worldMap";
import { BUILDING_WALL_HEIGHT, BUILDING_WALL_THICKNESS, getBuildingWallSegments } from "./wallLayout";

const WALL_COLOR = "#1c2c42";

// Outer perimeter of the plant, plus a lighter floor strip marking the
// hallway that runs between the two rows of rooms.
export default function BuildingShell() {
  const y = BUILDING_WALL_HEIGHT / 2;
  const span = BUILDING_HALF * 2;
  const segments = getBuildingWallSegments(BUILDING_HALF);

  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.cx, y, s.cz]} rotation={[0, s.rotationY, 0]}>
          <boxGeometry args={[s.length, BUILDING_WALL_HEIGHT, BUILDING_WALL_THICKNESS]} />
          <meshStandardMaterial color={WALL_COLOR} flatShading />
        </mesh>
      ))}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, (CORRIDOR_Z_MIN + CORRIDOR_Z_MAX) / 2]}
      >
        <planeGeometry args={[span - 0.4, CORRIDOR_Z_MAX - CORRIDOR_Z_MIN]} />
        <meshStandardMaterial color="#193050" />
      </mesh>
    </group>
  );
}
