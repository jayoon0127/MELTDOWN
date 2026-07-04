// Metal door + keypad standing in for the security zone until a real
// meshy.ai model replaces it.
export default function SecurityPlaceholder() {
  return (
    <group>
      <mesh position={[0, 0.55, -0.06]}>
        <boxGeometry args={[0.95, 1.1, 0.08]} />
        <meshStandardMaterial color="#5a4632" flatShading />
      </mesh>
      <mesh position={[0.06, 0.55, 0.03]}>
        <boxGeometry args={[0.72, 0.95, 0.06]} />
        <meshStandardMaterial color="#c98a4b" flatShading />
      </mesh>
      <mesh position={[0.38, 0.5, 0.09]}>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color="#2a2a2a" flatShading />
      </mesh>
      <mesh position={[-0.52, 0.68, 0.05]}>
        <boxGeometry args={[0.16, 0.22, 0.06]} />
        <meshStandardMaterial color="#1e3350" flatShading />
      </mesh>
      <mesh position={[-0.52, 0.68, 0.085]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshStandardMaterial color="#ff5757" emissive="#ff5757" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}
