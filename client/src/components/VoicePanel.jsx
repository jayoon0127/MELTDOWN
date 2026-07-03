export default function VoicePanel({ voice, players, myId }) {
  const {
    joined,
    muted,
    speakingIds,
    mutedIds,
    localSpeaking,
    voiceError,
    joinVoice,
    leaveVoice,
    toggleMute,
  } = voice;

  return (
    <div className="voice-panel">
      <div className="voice-controls">
        {!joined ? (
          <button className="voice-btn join" onClick={joinVoice}>
            🎙️ 음성 참여
          </button>
        ) : (
          <>
            <button className={`voice-btn ${muted ? "muted" : "on"}`} onClick={toggleMute}>
              {muted ? "🔇 음소거 해제" : "🎙️ 음소거"}
            </button>
            <button className="voice-btn leave" onClick={leaveVoice}>
              나가기
            </button>
          </>
        )}
        {voiceError && <span className="voice-error">{voiceError}</span>}
      </div>

      {joined && (
        <ul className="voice-list">
          {players
            .filter((p) => p.connected)
            .map((p) => {
              const isMe = p.id === myId;
              const isSpeaking = isMe ? localSpeaking : speakingIds.has(p.id);
              const isMuted = isMe ? muted : mutedIds.has(p.id);
              return (
                <li key={p.id} className={isSpeaking ? "speaking" : ""}>
                  <span className="voice-dot" />
                  {p.name}
                  {isMuted && <span className="voice-muted-icon">🔇</span>}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
