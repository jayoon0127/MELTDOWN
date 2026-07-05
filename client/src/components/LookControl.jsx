import { useCallback, useRef } from "react";

// Radians per pixel dragged. Small enough that a full screen-width swipe is
// roughly a quarter turn, not a dizzying spin.
const YAW_SENSITIVITY = 0.006;
const PITCH_SENSITIVITY = 0.006;
// Clamp how far you can tilt so you can't flip past looking straight up/down.
const MIN_PITCH = -0.6;
const MAX_PITCH = 1.1;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// A transparent drag surface covering the 3D view: dragging rotates the
// camera (yaw left/right, pitch up/down) independently of movement, the way
// a thumb-look zone works in most mobile shooters. Mutates lookRef directly
// (no React state) since FirstPersonRig reads it every frame and useMovement
// reads it every tick — both want the latest value without a re-render.
// Sits inside .map-wrap *before* the joystick/action-panel/chat button in
// the DOM so those keep capturing their own touches on top of this layer
// (see the z-index note on .look-control in index.css).
export default function LookControl({ lookRef }) {
  const dragRef = useRef(null); // { pointerId, lastX, lastY }

  const handlePointerDown = useCallback((e) => {
    dragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      const look = lookRef.current;
      look.yaw += dx * YAW_SENSITIVITY;
      look.pitch = clamp(look.pitch + dy * PITCH_SENSITIVITY, MIN_PITCH, MAX_PITCH);
    },
    [lookRef]
  );

  const handlePointerUp = useCallback((e) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }, []);

  return (
    <div
      className="look-control"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
