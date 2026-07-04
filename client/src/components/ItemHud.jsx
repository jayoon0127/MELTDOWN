// Surfaces whichever physical item interaction is relevant right now:
// an item sitting nearby to pick up, or the one the player is currently
// carrying (with throw/use actions). Only one of these is ever shown since
// a player can carry at most one item at a time (enforced server-side).
export default function ItemHud({ myItem, nearbyItems, canUseHere, onPickup, onDrop, onUse }) {
  if (myItem) {
    return (
      <div className="item-hud">
        <div className="item-hud-entry">
          <span className="item-icon">{myItem.icon}</span>
          <span className="item-name">{myItem.name}</span>
          <button className="item-btn" onClick={onDrop}>
            던지기
          </button>
          <button className="item-btn use" disabled={!canUseHere} onClick={onUse}>
            사용하기
          </button>
        </div>
      </div>
    );
  }

  if (nearbyItems.length === 0) return null;

  return (
    <div className="item-hud">
      {nearbyItems.map((it) => (
        <div key={it.id} className="item-hud-entry">
          <span className="item-icon">{it.icon}</span>
          <span className="item-name">{it.name}</span>
          <button className="item-btn" onClick={() => onPickup(it.id)}>
            줍기
          </button>
        </div>
      ))}
    </div>
  );
}
