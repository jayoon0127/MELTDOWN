import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import { ModelErrorBoundary } from "./ErrorBoundary";

function GLTFModel({ url, ...props }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} {...props} />;
}

// Renders a real glTF/GLB model dropped at `url` (e.g. a meshy.ai export in
// client/public/models/) once it exists, and falls back to a low-poly
// primitive placeholder while it doesn't — so the scene works today and
// upgrades automatically the moment an asset file shows up.
export default function ModelOrPlaceholder({ url, placeholder, ...props }) {
  return (
    <ModelErrorBoundary fallback={placeholder}>
      <Suspense fallback={placeholder}>
        <GLTFModel url={url} {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
