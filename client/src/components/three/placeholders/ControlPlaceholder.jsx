// Console desk with three glowing monitors standing in for the control
// room zone until a real meshy.ai model replaces it.
export default function ControlPlaceholder() {
  const monitors = [
    { x: -0.32, color: "#37d67a" },
    { x: 0.02, color: "#ffb020" },
    { x: 0.36, color: "#37d67a" },
  ];
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.08, 0.55]} />
        <meshStandardMaterial color="#e8ecf2" flatShading />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.17, 0.15]}>
          <boxGeometry args={[0.08, 0.34, 0.08]} />
          <meshStandardMaterial color="#c98a4b" flatShading />
        </mesh>
      ))}
      {monitors.map((m) => (
        <group key={m.x} position={[m.x, 0.56, -0.12]}>
          <mesh>
            <boxGeometry args={[0.28, 0.2, 0.03]} />
            <meshStandardMaterial color="#e8ecf2" flatShading />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.23, 0.15]} />
            <meshStandardMaterial color={m.color} emissive={m.color} emissiveIntensity={1.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
