"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { listenRoom, endRoom } from "@/lib/rooms";
import { listenActiveBattleForRoom } from "@/lib/pkbattle";
import { createAgoraClient, createCameraTrack, createMicTrack, AGORA_APP_ID } from "@/lib/agora";
import LiveChat from "@/components/LiveChat";
import GiftBar from "@/components/GiftBar";
import GiftFeed from "@/components/GiftFeed";
import PkBattlePanel from "@/components/PkBattlePanel";

export default function LiveRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState("");
  const [activeBattle, setActiveBattle] = useState(null);

  const clientRef = useRef(null);
  const localTracksRef = useRef({ cam: null, mic: null });
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const unsub = listenRoom(roomId, setRoom);
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    const unsub = listenActiveBattleForRoom(String(roomId), setActiveBattle);
    return () => unsub();
  }, [roomId]);

  const isHost = room && user && room.hostUid === user.uid;

  // Join / leave Agora channel once we know whether we're the host
  useEffect(() => {
    if (!room || !user || !AGORA_APP_ID) return;
    let cancelled = false;

    async function join() {
      try {
        const client = await createAgoraClient("live");
        clientRef.current = client;
        await client.setClientRole(isHost ? "host" : "audience");

        client.on("user-published", async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === "video") {
            const container = document.getElementById("remote-video");
            if (container) remoteUser.videoTrack.play(container);
          }
          if (mediaType === "audio") {
            remoteUser.audioTrack.play();
          }
        });

        // App ID-only auth (dev mode) — see lib/agora.js for production token note
        await client.join(AGORA_APP_ID, String(roomId), null, user.uid);
        if (cancelled) return;

        if (isHost) {
          const camTrack = await createCameraTrack();
          const micTrack = await createMicTrack();
          localTracksRef.current = { cam: camTrack, mic: micTrack };
          if (localVideoRef.current) camTrack.play(localVideoRef.current);
          await client.publish([camTrack, micTrack]);
        }

        setJoined(true);
      } catch (err) {
        console.error(err);
        setError("Could not connect to the stream. Check your Agora App ID.");
      }
    }

    join();

    return () => {
      cancelled = true;
      const { cam, mic } = localTracksRef.current;
      cam?.close();
      mic?.close();
      clientRef.current?.leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, isHost]);

  async function handleEndOrLeave() {
    if (isHost) await endRoom(roomId);
    router.push("/rooms");
  }

  function toggleMic() {
    const mic = localTracksRef.current.mic;
    if (!mic) return;
    mic.setEnabled(!micOn);
    setMicOn(!micOn);
  }

  if (loading || !user || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-void">
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-display text-sm font-bold text-ink">{room.title}</p>
          <p className="text-xs text-mist">Hosted by {room.hostName}</p>
        </div>
        <button
          onClick={handleEndOrLeave}
          className="rounded-full bg-panel px-3 py-1.5 text-xs font-semibold text-neon-pink ring-1 ring-neon-pink/30"
        >
          {isHost ? "End" : "Leave"}
        </button>
      </header>

      {!AGORA_APP_ID && (
        <p className="mx-4 rounded-lg bg-panel p-3 text-xs text-gold">
          ⚠️ NEXT_PUBLIC_AGORA_APP_ID is not set in .env.local — video won't connect until it is.
        </p>
      )}
      {error && <p className="mx-4 rounded-lg bg-panel p-3 text-xs text-neon-pink">{error}</p>}

      {/* Video stage */}
      <div className="relative mx-4 aspect-[9/16] max-h-[52vh] overflow-hidden rounded-2xl bg-panel">
        <GiftFeed roomId={String(roomId)} />
        {isHost ? (
          <div ref={localVideoRef} className="h-full w-full" />
        ) : (
          <div id="remote-video" className="h-full w-full" />
        )}
        {!joined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-mist">Connecting…</p>
          </div>
        )}
      </div>

      <PkBattlePanel room={room} roomId={String(roomId)} isHost={isHost} activeBattle={activeBattle} />

      {!isHost && (
        <GiftBar
          roomId={String(roomId)}
          fromUid={user.uid}
          fromName={profile?.displayName || "User"}
          toUid={room.hostUid}
          toName={room.hostName}
          myCoins={profile?.coins ?? 0}
          activeBattle={activeBattle}
          battleSide={activeBattle?.roomAId === String(roomId) ? "A" : "B"}
        />
      )}

      {isHost && (
        <div className="mx-4 mt-3 flex justify-center">
          <button
            onClick={toggleMic}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              micOn ? "bg-panel text-ink ring-1 ring-white/10" : "bg-neon-pink/20 text-neon-pink"
            }`}
          >
            {micOn ? "🎤 Mic On" : "🔇 Mic Off"}
          </button>
        </div>
      )}

      {/* Chat fills remaining space */}
      <div className="mt-3 flex-1 overflow-hidden">
        <LiveChat roomId={String(roomId)} uid={user.uid} name={profile?.displayName || "User"} />
      </div>
    </main>
  );
}
