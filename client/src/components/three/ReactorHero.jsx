import { Canvas } from "@react-three/fiber";
import ModelOrPlaceholder from "./ModelOrPlaceholder";
import ReactorCorePlaceholder from "./ReactorCorePlaceholder";

export default function ReactorHero() {
  return (
    <div className="reactor-hero">
      <Canvas camera={{ position: [2.4, 1.6, 2.4], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.4} />
        <ModelOrPlaceholder
          url="/models/reactor-core.glb"
          placeholder={<ReactorCorePlaceholder />}
        />
      </Canvas>
    </div>
  );
}
