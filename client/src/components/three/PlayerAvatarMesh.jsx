import { Html } from "@react-three/drei";
import ModelOrPlaceholder from "./ModelOrPlaceholder";

function CapsulePlaceholder({ color }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.22, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#ffe0b3" flatShading />
      </mesh>
    </group>
  );
}

export default function PlayerAvatarMesh({ color, name, isMe, carriedIcon }) {
  return (
    <group>
      <ModelOrPlaceholder
        url="/models/worker.glb"
        placeholder={<CapsulePlaceholder color={color} />}
        position={[0, 0.95, 0]}
      />
      <Html position={[0, 1.2, 0]} center style={{ pointerEvents: "none" }}>
        <span className={`avatar3d-name ${isMe ? "me" : ""}`}>
          {carriedIcon ? `${carriedIcon} ` : ""}
          {name}
        </span>
      </Html>
    </group>
  );
}
