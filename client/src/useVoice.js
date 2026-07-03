import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "./socket";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const SPEAKING_THRESHOLD = 14;

export function useVoiceChat() {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakingIds, setSpeakingIds] = useState(() => new Set());
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [mutedIds, setMutedIds] = useState(() => new Set());
  const [voiceError, setVoiceError] = useState("");

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const audioElsRef = useRef(new Map());
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  const cleanupPeer = useCallback((peerId) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
    const audioEl = audioElsRef.current.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      audioElsRef.current.delete(peerId);
    }
  }, []);

  const createPeer = useCallback((peerId, initiator) => {
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(peerId, pc);

    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("voice:signal", { to: peerId, data: { candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => {
      let audioEl = audioElsRef.current.get(peerId);
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        audioElsRef.current.set(peerId, audioEl);
      }
      audioEl.srcObject = e.streams[0];
    };

    if (initiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("voice:signal", { to: peerId, data: { sdp: pc.localDescription } });
        });
    }

    return pc;
  }, []);

  const handleSignal = useCallback(
    async ({ from, data }) => {
      let pc = peersRef.current.get(from);
      if (!pc) pc = createPeer(from, false);
      try {
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("voice:signal", { to: from, data: { sdp: pc.localDescription } });
          }
        } else if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error("voice signal error", err);
      }
    },
    [createPeer]
  );

  const startSpeakingDetector = useCallback((stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let wasSpeaking = false;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const speaking = avg > SPEAKING_THRESHOLD;
      if (speaking !== wasSpeaking) {
        wasSpeaking = speaking;
        socket.emit("voice:speaking", { speaking });
        setLocalSpeaking(speaking);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const leaveVoice = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    for (const peerId of [...peersRef.current.keys()]) cleanupPeer(peerId);
    socket.emit("voice:leave");
    setJoined(false);
    setMuted(false);
    setSpeakingIds(new Set());
    setMutedIds(new Set());
    setLocalSpeaking(false);
  }, [cleanupPeer]);

  const joinVoice = useCallback(async () => {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      socket.emit("voice:join", {}, (res) => {
        if (res?.error) {
          setVoiceError(res.error);
          return;
        }
        setJoined(true);
        startSpeakingDetector(stream);
        for (const peerId of res.peers || []) {
          createPeer(peerId, true);
        }
      });
    } catch (err) {
      setVoiceError("마이크 권한이 필요합니다.");
    }
  }, [createPeer, startSpeakingDetector]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    setMuted((prev) => {
      const next = !prev;
      for (const track of localStreamRef.current.getTracks()) track.enabled = !next;
      socket.emit("voice:mute", { muted: next });
      return next;
    });
  }, []);

  useEffect(() => {
    function onPeerLeft({ peerId }) {
      cleanupPeer(peerId);
      setSpeakingIds((prev) => {
        if (!prev.has(peerId)) return prev;
        const next = new Set(prev);
        next.delete(peerId);
        return next;
      });
      setMutedIds((prev) => {
        if (!prev.has(peerId)) return prev;
        const next = new Set(prev);
        next.delete(peerId);
        return next;
      });
    }
    function onSignal(payload) {
      handleSignal(payload);
    }
    function onSpeaking({ peerId, speaking }) {
      setSpeakingIds((prev) => {
        const has = prev.has(peerId);
        if (speaking === has) return prev;
        const next = new Set(prev);
        if (speaking) next.add(peerId);
        else next.delete(peerId);
        return next;
      });
    }
    function onMute({ peerId, muted: isMuted }) {
      setMutedIds((prev) => {
        const has = prev.has(peerId);
        if (isMuted === has) return prev;
        const next = new Set(prev);
        if (isMuted) next.add(peerId);
        else next.delete(peerId);
        return next;
      });
    }

    socket.on("voice:peer-left", onPeerLeft);
    socket.on("voice:signal", onSignal);
    socket.on("voice:speaking", onSpeaking);
    socket.on("voice:mute", onMute);
    return () => {
      socket.off("voice:peer-left", onPeerLeft);
      socket.off("voice:signal", onSignal);
      socket.off("voice:speaking", onSpeaking);
      socket.off("voice:mute", onMute);
    };
  }, [cleanupPeer, handleSignal]);

  useEffect(() => {
    return () => leaveVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    joined,
    muted,
    speakingIds,
    mutedIds,
    localSpeaking,
    voiceError,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
