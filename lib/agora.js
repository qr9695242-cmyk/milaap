// Agora RTC client helper.
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

/**
 * Creates a fresh Agora RTC client.
 * mode: "live" (video broadcast, host/audience roles) or "rtc" (audio room, everyone equal)
 */
export async function createAgoraClient(mode = "rtc") {
  const AgoraRTC = await loadAgora();
  return AgoraRTC.createClient({ mode, codec: "vp8" });
}

export async function createMicTrack() {
  const AgoraRTC = await loadAgora();
  return AgoraRTC.createMicrophoneAudioTrack();
}

export async function createCameraTrack() {
  const AgoraRTC = await loadAgora();
  return AgoraRTC.createCameraVideoTrack();
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
