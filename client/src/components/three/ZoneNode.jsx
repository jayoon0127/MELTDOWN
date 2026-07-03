import { Html } from "@react-three/drei";
import ModelOrPlaceholder from "./ModelOrPlaceholder";
import ZonePlaceholder from "./ZonePlaceholder";
import RoomShell from "./RoomShell";
import ContainmentPlaceholder from "./placeholders/ContainmentPlaceholder";
import SecurityPlaceholder from "./placeholders/SecurityPlaceholder";
import ControlPlaceholder from "./placeholders/ControlPlaceholder";
import { toWorld, ROOM_HALF_WIDTH, ROOM_HALF_DEPTH, getZoneDoorSide } from "./worldMap";

const ZONE_MODELS = {
  reactor: "/models/zone-reactor.glb",
  generator: "/models/zone-generator.glb",
  electrical: "/models/zone-electrical.glb",
};

// Every zone gets a real, purpose-built 3D object — either a loaded glb
// model, or (until one exists) a hand-built placeholder specific to that
// zone rather than a generic repeated shape.
const ZONE_PLACEHOLDERS = {
  containment: ContainmentPlaceholder,
  security: SecurityPlaceholder,
  control: ControlPlaceholder,
};

export default function ZoneNode({ zone, incidentCount, isDark }) {
  const [wx, , wz] = toWorld(zone.x, zone.y);
  const padRadius = zone.r * 10;
  const modelUrl = ZONE_MODELS[zone.id];
  const Placeholder = ZONE_PLACEHOLDERS[zone.id] || ZonePlaceholder;

  const padColor = isDark ? "#1a1010" : incidentCount > 0 ? "#3a3010" : "#16283f";
  const ringColor = isDark ? "#402020" : incidentCount > 0 ? "#ffcf4d" : "#2a4568";
  const doorSide = getZoneDoorSide(zone);

  return (
    <group position={[wx, 0, wz]}>
      <RoomShell halfWidth={ROOM_HALF_WIDTH} halfDepth={ROOM_HALF_DEPTH} doorSide={doorSide} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[padRadius, 40]} />
        <meshStandardMaterial color={padColor} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[padRadius - 0.06, padRadius, 48]} />
        <meshBasicMaterial color={ringColor} />
      </mesh>

      {modelUrl && !isDark ? (
        <ModelOrPlaceholder url={modelUrl} placeholder={<Placeholder />} />
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
    </group>
  );
}
