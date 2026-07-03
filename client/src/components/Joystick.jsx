import { useCallback, useRef, useState } from "react";

const MAX_OFFSET = 40; // px, matches CSS base size

export default function Joystick({ onChange }) {
  const baseRef = useRef(null);
  const pointerIdRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const updateFromEvent = useCallback(
    (clientX, clientY) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > MAX_OFFSET) {
        dx = (dx / dist) * MAX_OFFSET;
        dy = (dy / dist) * MAX_OFFSET;
      }
      setKnob({ x: dx, y: dy });
      onChange(dx / MAX_OFFSET, dy / MAX_OFFSET);
    },
    [onChange]
  );

  const handlePointerDown = useCallback(
    (e) => {
      pointerIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateFromEvent(e.clientX, e.clientY);
    },
    [updateFromEvent]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (pointerIdRef.current !== e.pointerId) return;
      updateFromEvent(e.clientX, e.clientY);
    },
    [updateFromEvent]
  );

  const handlePointerUp = useCallback((e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  }, [onChange]);

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="joystick-knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
