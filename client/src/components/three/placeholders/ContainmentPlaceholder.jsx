// Yellow/black radiation drum standing in for the containment zone until a
// real meshy.ai model replaces it.
export default function ContainmentPlaceholder() {
  const trefoilAngles = [0, 120, 240];
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.37, 0.3, 16]} />
        <meshStandardMaterial color="#15181f" flatShading />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.28, 16]} />
        <meshStandardMaterial color="#f4c430" flatShading />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.35, 0.36, 0.28, 16]} />
        <meshStandardMaterial color="#15181f" flatShading />
      </mesh>
      <mesh position={[0, 0.93, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.09, 16]} />
        <meshStandardMaterial color="#37d67a" flatShading />
      </mesh>
      {trefoilAngles.map((deg) => (
        <mesh
          key={deg}
          position={[Math.sin((deg * Math.PI) / 180) * 0.13, 1.0, Math.cos((deg * Math.PI) / 180) * 0.13]}
          rotation={[0, (-deg * Math.PI) / 180, 0]}
        >
          <coneGeometry args={[0.09, 0.06, 3]} />
          <meshStandardMaterial color="#15181f" flatShading />
        </mesh>
      ))}
    </group>
  );
}
