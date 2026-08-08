"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  listenRoom,
  takeSeat,
  takeSeatPriority,
  leaveSeat,
  kickFromSeat,
  toggleSeatMute,
  lockSeat,
  unlockSeat,
  lockAllSeats,
  unlockAllSeats,
  announceEntrance,
  endRoom,
  deleteRoomIfEmpty,
} from "@/lib/rooms";
import {
  sendSeatRequest,
  listenIncomingSeatRequests,
  respondSeatRequest,
} from "@/lib/roomRequests";
import {
  createAgoraClient,
  createMicTrack,
  createCustomAudioTrack,
  fetchAgoraToken,
  getRawMicStream,
  watchSpeakingUsers,
  watchConnectionState,
  AGORA_APP_ID,
} from "@/lib/agora";
import { createVoiceChanger } from "@/lib/voiceChanger";
import { findBackground } from "@/lib/backgrounds";
import { joinRoomPresence } from "@/lib/coHost";

import SeatGrid from "@/components/SeatGrid";
import SeatActionSheet from "@/components/SeatActionSheet";
import RoomRequests from "@/components/RoomRequests";
import GiftBar from "@/components/GiftBar";
import GiftFeed from "@/components/GiftFeed";
import LiveChat from "@/components/LiveChat";
import EntranceBanner from "@/components/EntranceBanner";
import FloatingHearts from "@/components/FloatingHearts";
import VoiceChangerPicker from "@/components/VoiceChangerPicker";
import BackgroundPicker from "@/components/BackgroundPicker";
import RoomMoreMenu from "@/components/RoomMoreMenu";
import GiftLevelBadge from "@/components/GiftLevelBadge";
import LudoGame from "@/components/LudoGame";
import PkBattlePanel from "@/components/PkBattlePanel";
import { listenActiveBattleForRoom, addBattleScore } from "@/lib/pkbattle";

export default function AudioRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [room, setRoom] = useState(null);
  const [roomError, setRoomError] = useState("");
  const [sheetSeat, setSheetSeat] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showGifts, setShowGifts] = useState(false);
  const [showLudo, setShowLudo] = useState(false);
  const [activeBattle, setActiveBattle] = useState(null);
  const [speakingUids, setSpeakingUids] = useState(new Set());
  const [voicePreset, setVoicePreset] = useState("original");
  const [hearts, setHearts] = useState([]);
  const [connError, setConnError] = useState("");
  const [busySeat, setBusySeat] = useState(false);

  const clientRef = useRef(null);
  const rawStreamRef = useRef(null);
  const changerRef = useRef(null);
  const publishedTrackRef = useRef(null);
  const announcedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Room doc subscription
  useEffect(() => {
    if (!roomId) return;
    const unsub = listenRoom(roomId, (r) => {
      setRoom(r);
      if (!r) setRoomError("Ye room ab available nahi hai.");
    });
    return () => unsub();
  }, [roomId]);

  // Incoming seat requests (host only sees requests addressed to them,
  // but any seated user can be invited to — this listens for requests
  // sent to *me*, e.g. a host inviting me onto a seat).
  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = listenIncomingSeatRequests(roomId, user.uid, setRequests);
    return () => unsub();
  }, [roomId, user]);

  // PK battle sync
  useEffect(() => {
    if (!roomId) return;
    const unsub = listenActiveBattleForRoom(roomId, setActiveBattle);
    return () => unsub();
  }, [roomId]);

  // Presence (so "Invite" pickers know who's in the room)
  useEffect(() => {
    if (!roomId || !user) return;
    const stop = joinRoomPresence(roomId, user.uid, profile?.displayName || "User");
    return stop;
  }, [roomId, user, profile?.displayName]);

  // Announce entrance once, after room + profile are loaded
  useEffect(() => {
    if (!roomId || !user || !room || announcedRef.current) return;
    announcedRef.current = true;
    announceEntrance(roomId, {
      uid: user.uid,
      name: profile?.displayName || "User",
      vehicleId: profile?.equippedVehicle,
      vehicleName: profile?.equippedVehicleName,
      vehicleImage: profile?.equippedVehicleImage,
    }).catch(() => {});
  }, [roomId, user, room, profile]);

  const mySeat = room?.seats?.find((s) => s.uid === user?.uid) || null;
  const isHost = room?.hostUid === user?.uid;

  // Join Agora + publish mic whenever I have a seat; leave/unpublish otherwise
  useEffect(() => {
    let cancelled = false;

    async function joinAudio() {
      if (!mySeat || !AGORA_APP_ID) return;
      try {
        const client = await createAgoraClient("rtc");
        clientRef.current = client;
        watchConnectionState(client, (state, reason) => {
          if (state === "DISCONNECTED") setConnError(`Connection lost${reason ? `: ${reason}` : ""}`);
          else setConnError("");
        });
        const token = await fetchAgoraToken(roomId, user.uid).catch(() => null);
        await client.join(AGORA_APP_ID, roomId, token, user.uid);
        if (cancelled) return;

        watchSpeakingUsers(client, setSpeakingUids);

        const rawStream = await getRawMicStream();
        rawStreamRef.current = rawStream;
        const changer = await createVoiceChanger(rawStream);
        changerRef.current = changer;
        changer.setPreset(voicePreset);

        const track = await createCustomAudioTrack(changer.outputTrack);
        publishedTrackRef.current = track;
        await client.publish([track]);
      } catch (err) {
        console.error("[audio-room] join failed:", err);
        if (!cancelled) setConnError(err?.message || "Could not connect to voice.");
      }
    }

    joinAudio();

    return () => {
      cancelled = true;
      publishedTrackRef.current?.close();
      publishedTrackRef.current = null;
      changerRef.current?.dispose();
      changerRef.current = null;
      rawStreamRef.current?.getTracks().forEach((t) => t.stop());
      rawStreamRef.current = null;
      clientRef.current?.leave().catch(() => {});
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySeat?.seatIndex, roomId, user?.uid]);

  useEffect(() => {
    changerRef.current?.setPreset(voicePreset);
  }, [voicePreset]);

  // Reflect host-side mute toggles into the actual published track
  useEffect(() => {
    if (!publishedTrackRef.current) return;
    if (mySeat?.muted) publishedTrackRef.current.setMuted?.(true);
    else publishedTrackRef.current.setMuted?.(false);
  }, [mySeat?.muted]);

  async function handleSeatTap(seat) {
    if (!user) return;
    setRoomError("");
    if (seat.uid === user.uid) {
      await leaveSeat(roomId, seat.seatIndex);
      return;
    }
    if (seat.uid) return; // occupied by someone else — nothing to do on tap
    if (seat.locked) {
      setRoomError("Ye seat locked hai.");
      return;
    }
    setBusySeat(true);
    try {
      await takeSeat(roomId, seat.seatIndex, user.uid, profile?.displayName || "User", profile?.vipLevel || 0, profile?.equippedFrame || null);
    } catch (err) {
      // Room full — VIP2+ can try to bump a lower-VIP priority seat
      if ((profile?.vipLevel || 0) >= 2) {
        try {
          await takeSeatPriority(roomId, user.uid, profile?.displayName || "User", profile?.vipLevel || 0, profile?.equippedFrame || null);
        } catch (err2) {
          setRoomError(err2.message || "Seat le nahi saka.");
        }
      } else {
        setRoomError(err.message || "Seat le nahi saka.");
      }
    } finally {
      setBusySeat(false);
    }
  }

  function handleSeatLongPress(seat) {
    if (!isHost) return;
    setSheetSeat(seat);
  }

  function spawnHeart() {
    const id = Date.now() + Math.random();
    setHearts((h) => [...h, { id, x: 70 + Math.random() * 20, emoji: "❤️" }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 2200);
  }

  async function handleInvite(seat) {
    if (!user) return;
    // Simple invite target picker: prompt for who to invite isn't wired to
    // a friend list here, so this sends the request to whichever seated
    // user's name we ask for isn't practical inline — instead this button
    // is used by hosts to (re)request a *viewer* takes an empty seat via
    // sendSeatRequest once a name/uid is known from AddGuestButton's
    // participant list. Kept simple: host taps a seat, we no-op unless a
    // participant has been selected elsewhere.
    return;
  }

  async function handleLeaveRoom() {
    if (mySeat) await leaveSeat(roomId, mySeat.seatIndex).catch(() => {});
    if (isHost) {
      const stillOccupied = room?.seats?.some((s) => s.uid && s.uid !== user.uid);
      if (!stillOccupied) {
        await endRoom(roomId).catch(() => {});
      }
    }
    router.push("/rooms");
  }

  if (loading || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void text-mist">
        {roomError ? (
          <div className="text-center">
            <p className="mb-3 text-sm text-ink">{roomError}</p>
            <button onClick={() => router.push("/rooms")} className="rounded-full bg-panel px-4 py-2 text-xs text-ink ring-1 ring-white/10">
              ← Back to Rooms
            </button>
          </div>
        ) : (
          <p className="text-sm">Loading room…</p>
        )}
      </div>
    );
  }

  const bg = findBackground(room.background);
  const targets = (room.seats || [])
    .filter((s) => s.uid && s.uid !== user?.uid)
    .map((s) => ({ uid: s.uid, name: s.name }));

  return (
    <div className="relative flex min-h-screen flex-col bg-void" style={{ background: bg.css }}>
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <button onClick={handleLeaveRoom} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel/80 text-ink ring-1 ring-white/10">
            ←
          </button>
          <div>
            <p className="max-w-[140px] truncate text-sm font-bold text-ink">{room.title}</p>
            <p className="text-[10px] text-mist">{room.hostName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHost && <BackgroundPicker roomId={roomId} current={room.background} />}
          <button onClick={() => setShowLudo(true)} aria-label="Ludo" className="rounded-full bg-panel/80 px-2.5 py-1.5 text-sm ring-1 ring-white/10">
            🎲
          </button>
          <RoomMoreMenu />
        </div>
      </div>

      {connError && (
        <p className="relative z-20 mx-3 mb-2 rounded-lg bg-neon-pink/10 px-3 py-2 text-[11px] text-neon-pink">
          {connError}
        </p>
      )}
      {roomError && (
        <p className="relative z-20 mx-3 mb-2 rounded-lg bg-neon-pink/10 px-3 py-2 text-[11px] text-neon-pink">
          {roomError}
        </p>
      )}

      <EntranceBanner roomId={roomId} />
      <GiftFeed roomId={roomId} />
      <FloatingHearts hearts={hearts} />
      <RoomRequests
        requests={requests}
        onAccept={(r) => respondSeatRequest(roomId, r.id, "accepted").then(() => handleSeatTap({ seatIndex: r.seatIndex, uid: null, locked: false }))}
        onReject={(r) => respondSeatRequest(roomId, r.id, "rejected")}
      />

      {/* Seats */}
      <div className="relative z-10 mt-2 flex-1">
        <SeatGrid
          seats={room.seats || []}
          myUid={user?.uid}
          isHost={isHost}
          speakingUids={speakingUids}
          onSeatTap={handleSeatTap}
          onSeatLongPress={handleSeatLongPress}
        />
        {busySeat && <p className="mt-2 text-center text-[10px] text-mist">Seat le rahe hain…</p>}
      </div>

      <PkBattlePanel room={room} roomId={roomId} isHost={isHost} activeBattle={activeBattle} />

      {/* Chat */}
      <div className="relative z-10 h-56 border-t border-white/5 bg-void/60 backdrop-blur">
        <LiveChat
          roomId={roomId}
          uid={user?.uid}
          name={profile?.displayName || "User"}
          vipLevel={profile?.vipLevel || 0}
          onOpenGifts={() => setShowGifts((s) => !s)}
          onSendHeart={spawnHeart}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="relative z-20 flex items-center gap-2 border-t border-white/5 bg-panel/90 px-3 py-2">
        {mySeat && (
          <VoiceChangerPicker
            current={voicePreset}
            onSelect={setVoicePreset}
            uid={user?.uid}
            unlocked={profile?.voiceChangerUnlocked || ["original"]}
          />
        )}
        <GiftLevelBadge totalGiftedCoins={profile?.totalGiftedCoins || 0} compact />
        <div className="ml-auto text-[11px] text-mist">
          ● {profile?.coins ?? 0} coins
        </div>
      </div>

      {showGifts && (
        <div className="relative z-20 bg-panel/95">
          <GiftBar
            roomId={roomId}
            fromUid={user?.uid}
            fromName={profile?.displayName || "User"}
            targets={targets}
            myCoins={profile?.coins || 0}
            onClose={() => setShowGifts(false)}
          />
        </div>
      )}

      {isHost && sheetSeat && (
        <SeatActionSheet
          seat={sheetSeat}
          onClose={() => setSheetSeat(null)}
          onLock={(s) => lockSeat(roomId, s.seatIndex)}
          onUnlock={(s) => unlockSeat(roomId, s.seatIndex)}
          onLockAll={() => lockAllSeats(roomId)}
          onUnlockAll={() => unlockAllSeats(roomId)}
          onMute={(s) => toggleSeatMute(roomId, s.seatIndex, true)}
          onUnmute={(s) => toggleSeatMute(roomId, s.seatIndex, false)}
          onKick={(s) => kickFromSeat(roomId, s.seatIndex)}
        />
      )}

      {showLudo && user && (
        <LudoGame
          uid={user.uid}
          name={profile?.displayName || "User"}
          avatar={profile?.avatar || ""}
          onClose={() => setShowLudo(false)}
        />
      )}
    </div>
  );
}
