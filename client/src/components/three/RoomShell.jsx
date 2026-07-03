const WALL_HEIGHT = 2.3;
const WALL_THICKNESS = 0.14;
const DOOR_WIDTH = 1.1;

function Wall({ length, position, rotationY, color }) {
  if (length <= 0.05) return null;
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

// Four walls around a zone with a doorway gap on one side, facing the
// shared hallway that runs through the middle of the map. Rooms are sized
// in server/src/game/constants.js's zone spacing so adjacent rooms never
// overlap.
export default function RoomShell({ halfWidth, halfDepth, doorSide, color = "#3a5578" }) {
  const y = WALL_HEIGHT / 2;
  const segX = (halfWidth * 2 - DOOR_WIDTH) / 2;
  const segZ = (halfDepth * 2 - DOOR_WIDTH) / 2;

  return (
    <group>
      {/* north wall (-z) */}
      {doorSide === "north" ? (
        <>
          <Wall length={segX} position={[-(DOOR_WIDTH / 2 + segX / 2), y, -halfDepth]} rotationY={0} color={color} />
          <Wall length={segX} position={[DOOR_WIDTH / 2 + segX / 2, y, -halfDepth]} rotationY={0} color={color} />
        </>
      ) : (
        <Wall length={halfWidth * 2} position={[0, y, -halfDepth]} rotationY={0} color={color} />
      )}

      {/* south wall (+z) */}
      {doorSide === "south" ? (
        <>
          <Wall length={segX} position={[-(DOOR_WIDTH / 2 + segX / 2), y, halfDepth]} rotationY={0} color={color} />
          <Wall length={segX} position={[DOOR_WIDTH / 2 + segX / 2, y, halfDepth]} rotationY={0} color={color} />
        </>
      ) : (
        <Wall length={halfWidth * 2} position={[0, y, halfDepth]} rotationY={0} color={color} />
      )}

      {/* west wall (-x) */}
      {doorSide === "west" ? (
        <>
          <Wall length={segZ} position={[-halfWidth, y, -(DOOR_WIDTH / 2 + segZ / 2)]} rotationY={Math.PI / 2} color={color} />
          <Wall length={segZ} position={[-halfWidth, y, DOOR_WIDTH / 2 + segZ / 2]} rotationY={Math.PI / 2} color={color} />
        </>
      ) : (
        <Wall length={halfDepth * 2} position={[-halfWidth, y, 0]} rotationY={Math.PI / 2} color={color} />
      )}

      {/* east wall (+x) */}
      {doorSide === "east" ? (
        <>
          <Wall length={segZ} position={[halfWidth, y, -(DOOR_WIDTH / 2 + segZ / 2)]} rotationY={Math.PI / 2} color={color} />
          <Wall length={segZ} position={[halfWidth, y, DOOR_WIDTH / 2 + segZ / 2]} rotationY={Math.PI / 2} color={color} />
        </>
      ) : (
        <Wall length={halfDepth * 2} position={[halfWidth, y, 0]} rotationY={Math.PI / 2} color={color} />
      )}
    </group>
  );
}
