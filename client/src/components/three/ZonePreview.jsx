import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import ModelOrPlaceholder from "./ModelOrPlaceholder";

function AutoRotate({ children }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5;
  });
  return <group ref={ref}>{children}</group>;
}

// Small always-on 3D preview embedded in a zone tile on the map. Falls back
// to rendering nothing (the zone's emoji icon shows instead) if the model
// file isn't there yet.
export default function ZonePreview({ url }) {
  return (
    <Canvas camera={{ position: [1.6, 1.3, 1.6], fov: 40 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} />
      <AutoRotate>
        <ModelOrPlaceholder url={url} placeholder={null} scale={0.9} />
      </AutoRotate>
    </Canvas>
  );
}
