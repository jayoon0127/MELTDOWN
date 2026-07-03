import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

// Low-poly, bright/comic placeholder standing in for a meshy.ai reactor
// core model. Swapped out automatically once /models/reactor-core.glb exists.
export default function ReactorCorePlaceholder() {
  const coreRef = useRef();
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.6;
    if (ring1.current) ring1.current.rotation.x += delta * 0.9;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.7;
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial
          color="#ffb020"
          emissive="#ff7a3d"
          emissiveIntensity={1.4}
          flatShading
        />
      </mesh>
      <mesh ref={ring1} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.15, 0.06, 8, 32]} />
        <meshStandardMaterial color="#37d67a" flatShading />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2.4, Math.PI / 2, 0]}>
        <torusGeometry args={[1.15, 0.06, 8, 32]} />
        <meshStandardMaterial color="#ff5757" flatShading />
      </mesh>
    </group>
  );
}
