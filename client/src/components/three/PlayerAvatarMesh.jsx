import { Html } from "@react-three/drei";

export default function PlayerAvatarMesh({ color, name, isMe }) {
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
      <Html position={[0, 1.2, 0]} center style={{ pointerEvents: "none" }}>
        <span className={`avatar3d-name ${isMe ? "me" : ""}`}>{name}</span>
      </Html>
    </group>
  );
}
