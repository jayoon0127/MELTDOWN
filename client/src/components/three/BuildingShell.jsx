import { BUILDING_HALF, CORRIDOR_Z_MIN, CORRIDOR_Z_MAX } from "./worldMap";

const WALL_HEIGHT = 2.6;
const WALL_THICKNESS = 0.2;
const WALL_COLOR = "#1c2c42";

function Wall({ length, position, rotationY }) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
      <meshStandardMaterial color={WALL_COLOR} flatShading />
    </mesh>
  );
}

// Outer perimeter of the plant, plus a lighter floor strip marking the
// hallway that runs between the two rows of rooms.
export default function BuildingShell() {
  const y = WALL_HEIGHT / 2;
  const span = BUILDING_HALF * 2;

  return (
    <group>
      <Wall length={span} position={[0, y, -BUILDING_HALF]} rotationY={0} />
      <Wall length={span} position={[0, y, BUILDING_HALF]} rotationY={0} />
      <Wall length={span} position={[-BUILDING_HALF, y, 0]} rotationY={Math.PI / 2} />
      <Wall length={span} position={[BUILDING_HALF, y, 0]} rotationY={Math.PI / 2} />

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
