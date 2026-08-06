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

// ⚠️ Production note: Agora ke liye token-based auth zaroori hai.
// Abhi App ID-only mode use ho raha hai (Agora Console > Project > "App ID"
// authentication — testing ke liye theek hai). Live launch se pehle:
//   1. Agora Console mein App Certificate enable karein
//   2. Ek backend API route banayein (/api/agora-token) jo Agora ke
//      "agora-access-token" package se RTC token generate kare
//   3. joinChannel() call mein wo token pass karein (null ki jagah)
// Ye is-liye zaroori hai kyunki App Certificate secret kabhi bhi
// frontend code mein nahi hona chahiye.
