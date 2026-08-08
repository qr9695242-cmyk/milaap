"use client";

import { useRef } from "react";
import { PRIORITY_SEAT_INDEXES } from "@/lib/vip";
import FramedAvatar from "./FramedAvatar";

const LONG_PRESS_MS = 420;

/**
 * seats: room.seats array (each seat now also carries `locked: boolean`)
 * speakingUids: Set<uid> of people currently talking (drives the glowing ring)
 * isHost: only the host can long-press a seat to open the lock/mute/kick sheet
 * onSeatLongPress(seat): fired after a long-press/right-click, host only
 */
export default function SeatGrid({ seats, myUid, isHost = false, speakingUids, onSeatTap, onSeatLongPress }) {
  const pressTimer = useRef(null);
  const longPressFired = useRef(false);

  function startPress(seat) {
    if (!isHost || !onSeatLongPress) return;
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onSeatLongPress(seat);
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function handleTap(seat) {
    if (longPressFired.current) {
      longPressFired.current = false;
      return; // long-press already handled this interaction
    }
    onSeatTap(seat);
  }

  return (
    <div className="grid grid-cols-4 gap-3 px-4">
      {seats.map((seat) => {
        const occupied = !!seat.uid;
        const isMe = seat.uid === myUid;
        const isVip = (seat.vipLevel || 0) > 0;
        const isPriority = PRIORITY_SEAT_INDEXES.includes(seat.seatIndex);
        const isSpeaking = occupied && speakingUids?.has(seat.uid);
        return (
          <button
            key={seat.seatIndex}
            onClick={() => handleTap(seat)}
            onContextMenu={(e) => {
              if (!isHost || !onSeatLongPress) return;
              e.preventDefault();
              onSeatLongPress(seat);
            }}
            onPointerDown={() => startPress(seat)}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            className="flex flex-col items-center gap-1"
          >
            {occupied ? (
              <div className="relative flex h-14 w-14 items-center justify-center">
                <span
                  className={`pointer-events-none absolute inset-0 rounded-full transition-shadow duration-150 ${
                    isSpeaking ? "shadow-[0_0_0_3px_rgba(34,197,94,0.85)]" : ""
                  }`}
                />
                <FramedAvatar
                  frameId={seat.frame}
                  name={seat.name}
                  size={44}
                  ring={!seat.frame}
                />
                {isMe && !seat.frame && (
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/60" />
                )}
                {isVip && <span className="absolute -right-1 -top-1 text-xs">👑</span>}
              </div>
            ) : seat.locked ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/15 text-base text-mist/70">
                🔒
              </div>
            ) : (
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                  isPriority
                    ? "border border-dashed border-gold/40 text-gold/60"
                    : "border border-dashed border-white/15 text-mist"
                }`}
              >
                +
              </div>
            )}
            <span className="max-w-[56px] truncate text-[10px] text-mist">
              {occupied ? seat.name : seat.locked ? "Locked" : `Seat ${seat.seatIndex + 1}`}
            </span>
            {occupied && seat.muted && (
              <span className="text-[9px] text-neon-pink">muted</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
