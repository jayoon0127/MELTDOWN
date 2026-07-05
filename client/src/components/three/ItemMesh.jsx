import { Html } from "@react-three/drei";
import ModelOrPlaceholder from "./ModelOrPlaceholder";

// Real glTF models for pickupable items and ground hazards, dropped in
// client/public/models/ — same graceful fallback pattern as ZONE_MODELS in
// ZoneNode.jsx: renders the model once the file exists, otherwise falls
// back to the floating icon label that's there today, so the game keeps
// working while these are still just emoji. See
// client/public/models/README.md for the meshy.ai request spec.
const ITEM_MODELS = {
  // FIRE_EXTINGUISHER: "/models/item-fire-extinguisher.glb",
  // WATER: "/models/item-water.glb",
  // BANANA: "/models/item-banana.glb",
  // APPLE: "/models/item-apple.glb",
  // RICE_BALL: "/models/item-rice-ball.glb",
  // COFFEE: "/models/item-coffee.glb",
  // INSTANT_NOODLES: "/models/item-instant-noodles.glb",
  // MILK: "/models/item-milk.glb",
  // CHOCOLATE_BAR: "/models/item-chocolate-bar.glb",
  // ENERGY_DRINK: "/models/item-energy-drink.glb",
  // BANANA_PEEL: "/models/hazard-banana-peel.glb",
};

// Per-typeId vertical offset + scale, for whenever a model's own origin
// isn't already sitting flush on the ground at a sensible on-screen size
// (same idea as ZoneNode's MODEL_Y_OFFSET — meshy.ai exports commonly
// center on their own bounding box rather than resting on Y=0).
const MODEL_Y_OFFSET = {};
const MODEL_SCALE = {};

// Renders whichever pickupable item or ground hazard sits at this spot:
// a real model if one's been dropped in for `typeId`, otherwise the
// existing floating icon. `iconHeight` lets callers match the icon's old
// position (items float around waist height, hazards sit near the floor).
export default function ItemMesh({ typeId, icon, iconHeight = 0.6 }) {
  const modelUrl = ITEM_MODELS[typeId];
  const iconLabel = (
    <Html position={[0, iconHeight, 0]} center style={{ pointerEvents: "none" }}>
      <div className="item3d-icon">{icon}</div>
    </Html>
  );

  if (!modelUrl) return iconLabel;

  return (
    <ModelOrPlaceholder
      url={modelUrl}
      placeholder={iconLabel}
      position={[0, MODEL_Y_OFFSET[typeId] || 0, 0]}
      scale={MODEL_SCALE[typeId] || 1}
    />
  );
}
