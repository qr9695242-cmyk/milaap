"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  listenRoom,
  endRoom,
  takeSeat,
  leaveSeat,
  toggleSeatMute,
  announceEntrance,
  lockSeat,
  unlockSeat,
  lockAllSeats,
  unlockAllSeats,
  kickFromSeat,
} from "@/lib/rooms";
import { findBackground } from "@/lib/backgrounds";
import { findItem } from "@/lib/decorations";
import {
  createAgoraClient,
  createCustomAudioTrack,
  fetchAgoraToken,
  getRawMicStream,
  AGORA_APP_ID,
  watchSpeakingUsers,
  watchNetworkQuality,
  watchConnectionState,
} from "@/lib/agora";
import { createVoiceChanger } from "@/lib/voiceChanger";
import SeatGrid from "@/components/SeatGrid";
import SeatActionSheet from "@/components/SeatActionSheet";
import VoiceChangerPicker from "@/components/VoiceChangerPicker";
import LiveChat from "@/components/LiveChat";
import GiftBar from "@/components/GiftBar";
import GiftFeed from "@/components/GiftFeed";
import GiftRideBanner from "@/components/GiftRideBanner";
import EntranceBanner from "@/components/EntranceBanner";
import BackgroundPicker from "@/components/BackgroundPicker";

const SIGNAL_LABEL = { 0: "", 1: "●", 2: "●", 3: "●", 4: "●", 5: "●", 6: "●" };

export default function AudioRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [speakingUids, setSpeakingUids] = useState(new Set());
  const [networkQuality, setNetworkQuality] = useState(0);
  const [connectionState, setConnectionState] = useState("DISCONNECTED");
  const [actionSeat, setActionSeat] = useState(null);
  const [voicePreset, setVoicePresetState] = useState("original");

  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const rawStreamRef = useRef(null);
  const voiceChangerRef = useRef(null);
  const remoteAudioRef = useRef({}); // uid -> audioTrack, so we can clean up on leave

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const unsub = listenRoom(roomId, setRoom);
    return () => unsub();
  }, [roomId]);

  const isHost = room && user && room.hostUid === user.uid;
  const mySeat = room?.seats?.find((s) => s.uid === user?.uid);

  // Announce this user's ride once per visit ("Ride in style when you enter a room")
  const announcedRef = useRef(false);
  useEffect(() => {
    if (!room || !user || announcedRef.current) return;
    announcedRef.current = true;
    const vehicleId = profile?.equippedVehicle;
    const vehicle = vehicleId ? findItem("vehicle", vehicleId) : null;
    announceEntrance(roomId, {
      uid: user.uid,
      name: profile?.displayName || "User",
      vehicleId: vehicle?.id,
      vehicleName: vehicle?.name,
      vehicleImage: vehicle?.image,
    });
  }, [room?.id, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join the Agora audio channel as soon as we land in the room (everyone can listen)
  useEffect(() => {
    if (!room || !user || !AGORA_APP_ID) return;
    let cancelled = false;
    let unwatchSpeaking = () => {};
    let unwatchNetwork = () => {};
    let unwatchConnection = () => {};

    async function join() {
      try {
        const client = await createAgoraClient("rtc");
        clientRef.current = client;

        client.on("user-published", async (remoteUser, mediaType) => {
          if (mediaType !== "audio") return;
          await client.subscribe(remoteUser, mediaType);
          remoteUser.audioTrack.play();
          remoteAudioRef.current[remoteUser.uid] = remoteUser.audioTrack;
        });

        client.on("user-unpublished", (remoteUser) => {
          delete remoteAudioRef.current[remoteUser.uid];
        });

        const token = await fetchAgoraToken(String(roomId), user.uid);
        if (cancelled) return;
        await client.join(AGORA_APP_ID, String(roomId), token, user.uid);
        if (cancelled) return;

        // Modern call-quality niceties: who's talking right now, how good is
        // the connection, and a heads-up if we drop and try to reconnect.
        unwatchSpeaking = watchSpeakingUsers(client, setSpeakingUids);
        unwatchNetwork = watchNetworkQuality(client, setNetworkQuality);
        unwatchConnection = watchConnectionState(client, (state) => setConnectionState(state));
      } catch (err) {
        console.error(err);
        const detail = err?.message || err?.code || "unknown error";
        setError(`Could not connect to audio (${detail}).`);
      }
    }

    join();

    return () => {
      cancelled = true;
      unwatchSpeaking();
      unwatchNetwork();
      unwatchConnection();
      voiceChangerRef.current?.dispose();
      voiceChangerRef.current = null;
      rawStreamRef.current?.getTracks().forEach((t) => t.stop());
      rawStreamRef.current = null;
      micTrackRef.current?.close();
      micTrackRef.current = null;
      clientRef.current?.leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  // Publish mic only while sitting in a seat — routed through the voice
  // changer's Web Audio graph so presets apply before Agora ever sees it.
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    async function publishMic() {
      if (mySeat && !micTrackRef.current) {
        try {
          const rawStream = await getRawMicStream();
          rawStreamRef.current = rawStream;
          const vc = await createVoiceChanger(rawStream);
          vc.setPreset(voicePreset);
          voiceChangerRef.current = vc;
          const track = await createCustomAudioTrack(vc.outputTrack);
          micTrackRef.current = track;
          await client.publish([track]);
        } catch (err) {
          console.error("voice changer publish failed, falling back to plain mic", err);
          setError("Voice effects unavailable on this device — using standard mic.");
          const { createMicTrack } = await import("@/lib/agora");
          const track = await createMicTrack();
          micTrackRef.current = track;
          await client.publish([track]);
        }
      }
      if (!mySeat && micTrackRef.current) {
        await client.unpublish([micTrackRef.current]);
        micTrackRef.current.close();
        micTrackRef.current = null;
        voiceChangerRef.current?.dispose();
        voiceChangerRef.current = null;
        rawStreamRef.current?.getTracks().forEach((t) => t.stop());
        rawStreamRef.current = null;
      }
    }
    publishMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySeat]);

  function setVoicePreset(id) {
    setVoicePresetState(id);
    voiceChangerRef.current?.setPreset(id);
  }

  async function handleSeatTap(seat) {
    if (seat.uid && seat.uid !== user.uid) return; // occupied by someone else
    if (seat.uid === user.uid) {
      await leaveSeat(roomId, seat.seatIndex);
      return;
    }
    if (seat.locked && !isHost) {
      setError("This seat is locked by the host.");
      return;
    }
    try {
      await takeSeat(
        roomId,
        seat.seatIndex,
        user.uid,
        profile?.displayName || "User",
        profile?.vipLevel || 0,
        profile?.equippedFrame || null
      );
    } catch (e) {
      // Seat got taken/locked a moment ago — ignore
    }
  }

  function handleSeatLongPress(seat) {
    if (!isHost) return;
    setActionSeat(seat);
  }

  function toggleMic() {
    if (!micTrackRef.current) return;
    micTrackRef.current.setEnabled(!micOn);
    toggleSeatMute(roomId, mySeat.seatIndex, micOn);
    setMicOn(!micOn);
  }

  // Back arrow only ever leaves the screen — it never closes the room, even
  // for the host. That way an accidental tap on "←" can't kill a live room;
  // it just steps you out while the broadcast keeps running for everyone
  // else. (Your mic auto-unpublishes because the Agora effect above cleans
  // up on unmount, same as before.)
  async function handleBack() {
    if (mySeat) await leaveSeat(roomId, mySeat.seatIndex);
    router.push("/rooms");
  }

  // The dedicated "End"/power-off control — the ONLY thing that can close
  // a room for everyone. Host gets a confirmation first, since this can't
  // be undone (matches the deliberate off-switch behaviour in the screenshot,
  // instead of the old one-tap-and-it's-gone version).
  async function handleLeaveOrEnd() {
    if (!isHost) {
      if (mySeat) await leaveSeat(roomId, mySeat.seatIndex);
      router.push("/rooms");
      return;
    }
    const sure = window.confirm("End this room for everyone? This can't be undone.");
    if (!sure) return;
    if (mySeat) await leaveSeat(roomId, mySeat.seatIndex);
    await endRoom(roomId);
    router.push("/rooms");
  }

  if (loading || !user || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  const bg = findBackground(room.background);
  const isReconnecting = connectionState === "RECONNECTING";

  return (
    <main className="flex min-h-screen flex-col bg-void" style={{ background: bg.css }}>
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} aria-label="Back" className="text-lg text-ink/80">
            ←
          </button>
          <div>
            <p className="font-display text-sm font-bold text-ink">{room.title}</p>
            <p className="text-xs text-mist">Hosted by {room.hostName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {networkQuality > 0 && (
            <span
              title="Call quality"
              className={`text-[10px] ${networkQuality <= 2 ? "text-green-400" : networkQuality <= 4 ? "text-gold" : "text-neon-pink"}`}
            >
              {SIGNAL_LABEL[networkQuality]}
            </span>
          )}
          {isHost && <BackgroundPicker roomId={String(roomId)} current={room.background} />}
          <button
            onClick={handleLeaveOrEnd}
            aria-label={isHost ? "End room" : "Leave room"}
            className="rounded-full bg-panel px-3 py-1.5 text-xs font-semibold text-neon-pink ring-1 ring-neon-pink/30"
          >
            {isHost ? "⏻ End" : "Leave"}
          </button>
        </div>
      </header>

      {!AGORA_APP_ID && (
        <p className="mx-4 rounded-lg bg-panel p-3 text-xs text-gold">
          ⚠️ NEXT_PUBLIC_AGORA_APP_ID is not set in .env.local — audio won't connect until it is.
        </p>
      )}
      {isReconnecting && (
        <p className="mx-4 rounded-lg bg-panel p-3 text-xs text-gold">🔄 Reconnecting audio…</p>
      )}
      {error && <p className="mx-4 rounded-lg bg-panel p-3 text-xs text-neon-pink">{error}</p>}

      <div className="relative mt-4">
        <GiftFeed roomId={String(roomId)} />
        <GiftRideBanner roomId={String(roomId)} />
        <EntranceBanner roomId={String(roomId)} />
        <SeatGrid
          seats={room.seats || []}
          myUid={user.uid}
          isHost={isHost}
          speakingUids={speakingUids}
          onSeatTap={handleSeatTap}
          onSeatLongPress={handleSeatLongPress}
        />
        {isHost && (
          <p className="mt-2 text-center text-[10px] text-mist/70">Hold a seat to lock, mute, or manage it</p>
        )}
      </div>

      <GiftBar
        roomId={String(roomId)}
        fromUid={user.uid}
        fromName={profile?.displayName || "User"}
        targets={(room.seats || [])
          .filter((s) => s.uid && s.uid !== user.uid)
          .map((s) => ({ uid: s.uid, name: s.name }))}
        myCoins={profile?.coins ?? 0}
      />

      {mySeat && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={toggleMic}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              micOn ? "bg-panel text-ink ring-1 ring-white/10" : "bg-neon-pink/20 text-neon-pink"
            }`}
          >
            {micOn ? "🎤 Mic On" : "🔇 Mic Off"}
          </button>
          <VoiceChangerPicker current={voicePreset} onSelect={setVoicePreset} />
        </div>
      )}

      <div className="mt-4 flex-1 overflow-hidden border-t border-white/5">
        <LiveChat roomId={String(roomId)} uid={user.uid} name={profile?.displayName || "User"} />
      </div>

      <SeatActionSheet
        seat={actionSeat}
        onClose={() => setActionSeat(null)}
        onLock={(s) => lockSeat(roomId, s.seatIndex)}
        onUnlock={(s) => unlockSeat(roomId, s.seatIndex)}
        onLockAll={() => lockAllSeats(roomId)}
        onUnlockAll={() => unlockAllSeats(roomId)}
        onMute={(s) => toggleSeatMute(roomId, s.seatIndex, true)}
        onUnmute={(s) => toggleSeatMute(roomId, s.seatIndex, false)}
        onKick={(s) => kickFromSeat(roomId, s.seatIndex)}
      />
    </main>
  );
}
