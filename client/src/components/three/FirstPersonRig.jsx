import { useFrame, useThree } from "@react-three/fiber";

const EYE_HEIGHT = 1.5;
// Look-ahead point is far enough away that pitch gives a stable,
// distance-independent tilt (rather than one that steepens the closer you
// stand to something).
const FORWARD_DIST = 8;

// Keeps the camera glued to the local player's anchor group (updated
// imperatively by useMovement) at eye height, facing whatever direction
// lookRef.current says — which LookControl mutates via drag, independently
// of movement. Movement itself is rotated to match this same yaw in
// useMovement so "forward" always means "wherever the camera is looking."
export default function FirstPersonRig({ avatarRef, lookRef }) {
  const { camera } = useThree();

  useFrame(() => {
    const anchor = avatarRef.current;
    if (!anchor) return;
    const pos = anchor.position;
    const { yaw, pitch } = lookRef.current;
    const lookDown = FORWARD_DIST * Math.tan(pitch);

    camera.position.set(pos.x, EYE_HEIGHT, pos.z);
    camera.lookAt(
      pos.x + Math.sin(yaw) * FORWARD_DIST,
      EYE_HEIGHT - lookDown,
      pos.z + Math.cos(yaw) * FORWARD_DIST
    );
  });

  return null;
}
