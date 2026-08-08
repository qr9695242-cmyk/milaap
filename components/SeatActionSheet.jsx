"use client";

/**
 * Host-only bottom sheet shown on long-press of a seat, styled after the
 * "On mic / Invite / Lock / Lock All / Mute" menu. Options adapt to whether
 * the seat is empty or occupied.
 *
 * Props:
 *  - seat: the seat object being acted on (or null when closed)
 *  - onClose()
 *  - onLock(seat) / onUnlock(seat)
 *  - onLockAll() / onUnlockAll()
 *  - onMute(seat) / onUnmute(seat)
 *  - onKick(seat)
 *  - onInvite(seat)   optional — hook up to your follower/invite picker
 */
export default function SeatActionSheet({
  seat,
  onClose,
  onLock,
  onUnlock,
  onLockAll,
  onUnlockAll,
  onMute,
  onUnmute,
  onKick,
  onInvite,
}) {
  if (!seat) return null;

  const occupied = !!seat.uid;

  const actions = occupied
    ? [
        {
          label: seat.muted ? "Unmute" : "Mute",
          onClick: () => (seat.muted ? onUnmute?.(seat) : onMute?.(seat)),
        },
        { label: "Remove from seat", onClick: () => onKick?.(seat), danger: true },
        { label: "Lock All", onClick: () => onLockAll?.() },
        { label: "Unlock All", onClick: () => onUnlockAll?.() },
      ]
    : [
        onInvite && { label: "Invite", onClick: () => onInvite(seat) },
        {
          label: seat.locked ? "Unlock" : "Lock",
          onClick: () => (seat.locked ? onUnlock?.(seat) : onLock?.(seat)),
        },
        { label: "Lock All", onClick: () => onLockAll?.() },
        { label: "Unlock All", onClick: () => onUnlockAll?.() },
      ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-panel pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-5 pt-4 text-center text-[11px] text-mist">
          {occupied ? seat.name : `Seat ${seat.seatIndex + 1}`}
        </p>
        <div className="mt-2 divide-y divide-white/5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                a.onClick();
                onClose();
              }}
              className={`w-full py-3.5 text-center text-sm font-medium ${
                a.danger ? "text-neon-pink" : "text-ink"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-1 w-full border-t border-white/5 py-3.5 text-center text-sm text-mist"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
