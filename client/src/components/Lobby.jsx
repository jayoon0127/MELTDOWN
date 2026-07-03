export default function Lobby({ room, myId, onStart }) {
  const isHost = room.hostId === myId;
  const canStart = room.players.filter((p) => p.connected).length >= 1;

  return (
    <div className="screen lobby-screen">
      <h2>대기실</h2>
      <div className="room-code-box">
        <span>방 코드</span>
        <strong>{room.code}</strong>
        <button
          className="copy-btn"
          onClick={() => navigator.clipboard?.writeText(room.code)}
        >
          복사
        </button>
      </div>

      <ul className="player-list">
        {room.players.map((p) => (
          <li key={p.id} className={p.connected ? "" : "disconnected"}>
            <span className="avatar">👷</span>
            <span>{p.name}</span>
            {p.id === room.hostId && <span className="host-badge">방장</span>}
          </li>
        ))}
      </ul>

      {isHost ? (
        <button className="primary-btn" disabled={!canStart} onClick={onStart}>
          가동 시작 (게임 시작)
        </button>
      ) : (
        <p className="waiting">방장이 게임을 시작하길 기다리는 중...</p>
      )}
      <p className="hint">
        고정 역할은 없습니다. 사고가 발생하면 서로 외치며 나눠서 처리하세요.
      </p>
    </div>
  );
}
