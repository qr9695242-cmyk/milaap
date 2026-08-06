"use client";

export default function SeatGrid({ seats, myUid, onSeatTap }) {
  return (
    <div className="grid grid-cols-4 gap-3 px-4">
      {seats.map((seat) => {
        const occupied = !!seat.uid;
        const isMe = seat.uid === myUid;
        return (
          <button
            key={seat.seatIndex}
            onClick={() => onSeatTap(seat)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                occupied
                  ? isMe
                    ? "bg-glow-gradient text-ink ring-2 ring-white/60"
                    : "bg-panel2 text-ink ring-1 ring-white/10"
                  : "border border-dashed border-white/15 text-mist"
              }`}
            >
              {occupied ? (seat.name || "?").charAt(0).toUpperCase() : "+"}
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
