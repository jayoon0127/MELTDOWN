import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const EYE_HEIGHT = 1.5;
const TURN_SPEED = 6;
// Look-ahead point is far enough away that PITCH_DEG gives a stable,
// distance-independent downward tilt (rather than one that steepens the
// closer you stand to something).
const FORWARD_DIST = 8;
const PITCH_DEG = 12;
const LOOK_DOWN = FORWARD_DIST * Math.tan((PITCH_DEG * Math.PI) / 180);

function shortestAngleDiff(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

// Keeps the camera glued to the local player's anchor group (updated
// imperatively by useMovement) at eye height, smoothly turning to face
// whichever direction they're currently walking, with a gentle constant
// downward tilt so nearby zone props stay in frame. Facing is tracked as a
// yaw angle (not a lerped vector) so a full about-face doesn't degenerate
// through a near-zero direction on the way.
export default function FirstPersonRig({ avatarRef }) {
  const { camera } = useThree();
  const lastPos = useRef(null);
  const yaw = useRef(0);

  useFrame((_, delta) => {
    const anchor = avatarRef.current;
    if (!anchor) return;
    const pos = anchor.position;

    if (!lastPos.current) {
      lastPos.current = { x: pos.x, z: pos.z };
    }

    const dx = pos.x - lastPos.current.x;
    const dz = pos.z - lastPos.current.z;
    if (Math.hypot(dx, dz) > 0.0005) {
      const targetYaw = Math.atan2(dx, dz);
      yaw.current += shortestAngleDiff(yaw.current, targetYaw) * Math.min(1, delta * TURN_SPEED);
    }
    lastPos.current.x = pos.x;
    lastPos.current.z = pos.z;

    camera.position.set(pos.x, EYE_HEIGHT, pos.z);
    camera.lookAt(
      pos.x + Math.sin(yaw.current) * FORWARD_DIST,
      EYE_HEIGHT - LOOK_DOWN,
      pos.z + Math.cos(yaw.current) * FORWARD_DIST
    );
  });

  return null;
}
