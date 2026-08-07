"use client";

import { PRIORITY_SEAT_INDEXES } from "@/lib/vip";

export default function SeatGrid({ seats, myUid, onSeatTap }) {
  return (
    <div className="grid grid-cols-4 gap-3 px-4">
      {seats.map((seat) => {
        const occupied = !!seat.uid;
        const isMe = seat.uid === myUid;
        const isVip = (seat.vipLevel || 0) > 0;
        const isPriority = PRIORITY_SEAT_INDEXES.includes(seat.seatIndex);
        return (
          <button
            key={seat.seatIndex}
            onClick={() => onSeatTap(seat)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`relative flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                occupied
                  ? isMe
                    ? "bg-glow-gradient text-ink ring-2 ring-white/60"
                    : isVip
                    ? "bg-panel2 text-ink ring-2 ring-gold"
                    : "bg-panel2 text-ink ring-1 ring-white/10"
                  : isPriority
                  ? "border border-dashed border-gold/40 text-gold/60"
                  : "border border-dashed border-white/15 text-mist"
              }`}
            >
              {occupied ? (seat.name || "?").charAt(0).toUpperCase() : "+"}
              {isVip && (
                <span className="absolute -right-1 -top-1 text-xs">👑</span>
              )}
            </div>
            <span className="max-w-[56px] truncate text-[10px] text-mist">
              {occupied ? seat.name : `Seat ${seat.seatIndex + 1}`}
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
