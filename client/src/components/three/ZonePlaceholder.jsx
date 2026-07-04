// Simple low-poly stand-in for zones without a real meshy.ai model yet.
export default function ZonePlaceholder({ color }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.9, 0.8, 0.9]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#ffb020" emissive="#ff7a3d" emissiveIntensity={0.6} flatShading />
      </mesh>
    </group>
  );
}
