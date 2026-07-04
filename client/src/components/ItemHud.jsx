// "먹기" (eat) vs "마시기" (drink) is picked by whichever stat the item's
// eatEffect leans on harder, regardless of whether the effect is good for
// you — the fire extinguisher still gets labeled like food, since not
// telegraphing that it's a bad idea is the joke.
function eatVerb(eatEffect) {
  const hunger = Math.abs(eatEffect.hunger || 0);
  const thirst = Math.abs(eatEffect.thirst || 0);
  return thirst > hunger ? "마시기" : "먹기";
}

// Surfaces whichever physical item interaction is relevant right now: an
// item sitting nearby to pick up, or the one the player is currently
// carrying. A carried item can offer a tool-use action (usableOn, gated by
// canUseHere), an eat/drink action (eatEffect, always available), or both
// at once — only one item can be carried at a time (enforced server-side).
export default function ItemHud({ myItem, nearbyItems, canUseHere, onPickup, onDrop, onUse, onEat }) {
  if (myItem) {
    return (
      <div className="item-hud">
        <div className="item-hud-entry">
          <span className="item-icon">{myItem.icon}</span>
          <span className="item-name">{myItem.name}</span>
          <button className="item-btn" onClick={onDrop}>
            던지기
          </button>
          {myItem.usableOn && (
            <button className="item-btn use" disabled={!canUseHere} onClick={onUse}>
              사용하기
            </button>
          )}
          {myItem.eatEffect && (
            <button className="item-btn use" onClick={onEat}>
              {eatVerb(myItem.eatEffect)}
            </button>
          )}
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
