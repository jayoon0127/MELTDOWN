import { useMemo, useState } from "react";

const COLORS = ["#ff5757", "#37d67a", "#ffb020", "#4da3ff"];

function shuffledIndices(n) {
  const arr = [...Array(n).keys()];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A small click-to-connect puzzle: match each left terminal to the right
// terminal of the same color, in any order. Touch-friendly (no drag) since
// the game targets mobile too. On full completion calls onComplete, which
// the caller uses to award the incident's minigame progress bonus.
export default function NodeConnectMinigame({ onComplete }) {
  const rightOrder = useMemo(() => shuffledIndices(COLORS.length), []);
  const [connections, setConnections] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [wrongSlot, setWrongSlot] = useState(null);

  function pickLeft(i) {
    if (connections[i] !== undefined) return;
    setSelectedLeft(i);
  }

  function pickRight(slot) {
    if (selectedLeft === null) return;
    if (Object.values(connections).includes(slot)) return;
    const rightColorIndex = rightOrder[slot];
    if (rightColorIndex === selectedLeft) {
      const next = { ...connections, [selectedLeft]: slot };
      setConnections(next);
      setSelectedLeft(null);
      if (Object.keys(next).length === COLORS.length) {
        setTimeout(() => onComplete(), 350);
      }
    } else {
      setWrongSlot(slot);
      setSelectedLeft(null);
      setTimeout(() => setWrongSlot(null), 300);
    }
  }

  return (
    <div className="node-minigame">
      <p className="node-minigame-hint">같은 색 단자끼리 순서대로 눌러 연결하세요.</p>
      <div className="node-minigame-grid">
        <div className="node-col">
          {COLORS.map((color, i) => (
            <button
              key={i}
              type="button"
              className={`node-dot ${selectedLeft === i ? "selected" : ""} ${
                connections[i] !== undefined ? "connected" : ""
              }`}
              style={{ "--node-color": color }}
              disabled={connections[i] !== undefined}
              onClick={() => pickLeft(i)}
            />
          ))}
        </div>
        <div className="node-col">
          {rightOrder.map((colorIndex, slot) => (
            <button
              key={slot}
              type="button"
              className={`node-dot ${wrongSlot === slot ? "wrong" : ""} ${
                Object.values(connections).includes(slot) ? "connected" : ""
              }`}
              style={{ "--node-color": COLORS[colorIndex] }}
              disabled={Object.values(connections).includes(slot)}
              onClick={() => pickRight(slot)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
