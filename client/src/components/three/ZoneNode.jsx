import { Html } from "@react-three/drei";
import ModelOrPlaceholder from "./ModelOrPlaceholder";
import ZonePlaceholder from "./ZonePlaceholder";
import RoomShell from "./RoomShell";
import ItemMesh from "./ItemMesh";
import ContainmentPlaceholder from "./placeholders/ContainmentPlaceholder";
import SecurityPlaceholder from "./placeholders/SecurityPlaceholder";
import ControlPlaceholder from "./placeholders/ControlPlaceholder";
import { toWorld, ROOM_HALF_WIDTH, ROOM_HALF_DEPTH, getZoneDoorSide } from "./worldMap";

const ZONE_MODELS = {
  reactor: "/models/zone-reactor.glb",
  generator: "/models/zone-generator.glb",
  electrical: "/models/zone-electrical.glb",
  control: "/models/zone-control.glb",
  security: "/models/zone-security.glb",
};

// Each meshy.ai export is vertically centered on its own origin rather than
// resting on the ground, and by a different amount each time — this lifts
// every model by (roughly) its own bounding-box depth below zero so it
// sits flush on the floor instead of burying its base.
const MODEL_Y_OFFSET = {
  reactor: 0.34,
  generator: 0.4,
  electrical: 0.6,
  control: 0.7,
  security: 0.84,
};

// Every zone gets a real, purpose-built 3D object — either a loaded glb
// model, or (until one exists) a hand-built placeholder specific to that
// zone rather than a generic repeated shape.
const ZONE_PLACEHOLDERS = {
  containment: ContainmentPlaceholder,
  security: SecurityPlaceholder,
  control: ControlPlaceholder,
};

export default function ZoneNode({ zone, incidentCount, isDark, items = [] }) {
  const [wx, , wz] = toWorld(zone.x, zone.y);
  const modelUrl = ZONE_MODELS[zone.id];
  const Placeholder = ZONE_PLACEHOLDERS[zone.id] || ZonePlaceholder;

  const padColor = isDark ? "#1a1010" : incidentCount > 0 ? "#3a3010" : "#16283f";
  const ringColor = isDark ? "#402020" : incidentCount > 0 ? "#ffcf4d" : "#2a4568";
  const doorSide = getZoneDoorSide(zone);

  return (
    <group position={[wx, 0, wz]}>
      <RoomShell halfWidth={ROOM_HALF_WIDTH} halfDepth={ROOM_HALF_DEPTH} doorSide={doorSide} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[ROOM_HALF_WIDTH * 2, ROOM_HALF_DEPTH * 2]} />
        <meshStandardMaterial color={padColor} />
      </mesh>
      {/* Thin accent strip just inside the walls, replacing the old alert ring now that the floor is rectangular. */}
      <mesh position={[0, 0.02, -ROOM_HALF_DEPTH + 0.05]}>
        <boxGeometry args={[ROOM_HALF_WIDTH * 2 - 0.1, 0.02, 0.06]} />
        <meshBasicMaterial color={ringColor} />
      </mesh>
      <mesh position={[0, 0.02, ROOM_HALF_DEPTH - 0.05]}>
        <boxGeometry args={[ROOM_HALF_WIDTH * 2 - 0.1, 0.02, 0.06]} />
        <meshBasicMaterial color={ringColor} />
      </mesh>
      <mesh position={[-ROOM_HALF_WIDTH + 0.05, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.02, ROOM_HALF_DEPTH * 2 - 0.1]} />
        <meshBasicMaterial color={ringColor} />
      </mesh>
      <mesh position={[ROOM_HALF_WIDTH - 0.05, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.02, ROOM_HALF_DEPTH * 2 - 0.1]} />
        <meshBasicMaterial color={ringColor} />
      </mesh>

      {modelUrl && !isDark ? (
        <ModelOrPlaceholder
          url={modelUrl}
          placeholder={<Placeholder />}
          position={[0, MODEL_Y_OFFSET[zone.id] || 0, 0]}
        />
      ) : isDark ? (
        <ZonePlaceholder color="#333c48" />
      ) : (
        <Placeholder />
      )}

      <Html position={[0, 1.9, 0]} center style={{ pointerEvents: "none" }}>
        <div className="zone3d-label">
          <span className="zone3d-name">{isDark ? "???" : zone.name}</span>
          {incidentCount > 0 && <span className="zone3d-badge">{incidentCount}</span>}
        </div>
      </Html>

      {!isDark &&
        items.map((it, i) => (
          <group key={it.id} position={[-ROOM_HALF_WIDTH * 0.5 + i * 0.4, 0, ROOM_HALF_DEPTH * 0.6]}>
            <ItemMesh typeId={it.typeId} icon={it.icon} />
          </group>
        ))}
    </group>
  );
}
