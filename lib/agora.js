// Agora RTC client helper — voice-only. Video/camera support has been
// removed from the app; every room is a voice room now.
// SDK reads `document`/`window`, so it must only ever be imported
// inside the browser (useEffect), never at module top-level — that's
// why this uses a dynamic import instead of a static one.

let AgoraRTCPromise = null;

function loadAgora() {
  if (!AgoraRTCPromise) {
    AgoraRTCPromise = import("agora-rtc-sdk-ng").then((mod) => mod.default);
  }
  return AgoraRTCPromise;
}

/** Creates a fresh Agora RTC client in "rtc" mode (voice room, everyone equal). */
export async function createAgoraClient(mode = "rtc") {
  const AgoraRTC = await loadAgora();
  return AgoraRTC.createClient({ mode, codec: "vp8" });
}

/**
 * Plain microphone track with modern call-quality processing turned on:
 *  - AEC (Acoustic Echo Cancellation) — no feedback when speakers are used
 *  - ANS (Automatic Noise Suppression) — cuts background/room noise
 *  - AGC (Automatic Gain Control) — keeps quiet/loud speakers balanced
 * "music_standard" gives fuller-bandwidth voice than the old default,
 * which is what most 2025/2026-era social voice-room apps ship with.
 */
export async function createMicTrack() {
  const AgoraRTC = await loadAgora();
  return AgoraRTC.createMicrophoneAudioTrack({
    AEC: true,
    ANS: true,
    AGC: true,
    encoderConfig: "music_standard",
  });
}

/**
 * Raw getUserMedia stream with the same AEC/ANS/AGC constraints, used when
 * we need to run the mic through our own Web Audio graph first (e.g. the
 * voice changer) before handing it to Agora as a custom track.
 */
export async function getRawMicStream() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });
}

/**
 * Wraps an arbitrary MediaStreamTrack (e.g. the output of the voice-changer
 * Web Audio graph) as a publishable Agora audio track.
 */
export async function createCustomAudioTrack(mediaStreamTrack) {
  const AgoraRTC = await loadAgora();
  return AgoraRTC.createCustomAudioTrack({ mediaStreamTrack });
}

export const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

// Fetches a fresh RTC token from our own backend (/api/agora-token), which
// signs it server-side using the App Certificate (never exposed to the
// browser). Token is valid 24h and scoped to this exact channel + uid pair.
// Call this right before client.join() instead of passing null.
export async function fetchAgoraToken(channel, uid) {
  const res = await fetch(
    `/api/agora-token?channel=${encodeURIComponent(channel)}&uid=${encodeURIComponent(uid)}`
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Could not fetch Agora token");
  }
  return data.token;
}

/**
 * Turns on Agora's per-uid volume metering and forwards a Set of "currently
 * speaking" uids to `onSpeaking` every ~200ms. Drives the glowing ring
 * around an active speaker's avatar in SeatGrid. Returns an unsubscribe fn.
 */
export function watchSpeakingUsers(client, onSpeaking, threshold = 5) {
  client.enableAudioVolumeIndicator();
  const handler = (volumes) => {
    const speaking = new Set(
      volumes.filter((v) => v.level > threshold).map((v) => v.uid)
    );
    onSpeaking(speaking);
  };
  client.on("volume-indicator", handler);
  return () => client.off("volume-indicator", handler);
}

/**
 * Reports uplink call quality (0 = unknown, 1 = excellent … 6 = down) so the
 * UI can show a signal indicator and warn a host their audio is degraded.
 */
export function watchNetworkQuality(client, onQuality) {
  const handler = (stats) => onQuality(stats.uplinkNetworkQuality);
  client.on("network-quality", handler);
  return () => client.off("network-quality", handler);
}

/**
 * Surfaces disconnects/reconnects so the room UI can show a "Reconnecting…"
 * banner instead of silently dropping audio — expected baseline UX for any
 * voice-call product today.
 */
export function watchConnectionState(client, onChange) {
  const handler = (curState, _prevState, reason) => onChange(curState, reason);
  client.on("connection-state-change", handler);
  return () => client.off("connection-state-change", handler);
}
