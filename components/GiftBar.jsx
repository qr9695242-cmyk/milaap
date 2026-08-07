import { useState } from "react";
import { GIFT_CATALOG } from "../lib/gifts";

export default function GiftBar({ targets = [], activeTarget, onSend }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(null);

  const target = activeTarget || targets?.[0];

  async function sendGift(gift) {
    if (!target || sending) return;
    try {
      setSending(gift.id);
      await onSend?.(gift, target);
      setOpen(false);
    } finally {
      setSending(null);
    }
  }

  return (
    <>
      {/* Compact live control, like a social-live gift button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open gifts"
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 text-2xl shadow-[0_0_22px_rgba(255,45,155,.4)] ring-2 ring-white/20"
      >
        🎁
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#111323] p-4 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">Send a Gift</h3>
                <p className="text-[11px] text-white/50">
                  To {target?.name || "Live Host"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {GIFT_CATALOG.map((gift) => (
                <button
                  key={gift.id}
                  type="button"
                  onClick={() => sendGift(gift)}
                  disabled={sending === gift.id}
                  className={`flex min-h-[82px] flex-col items-center justify-center rounded-2xl border p-2 transition active:scale-95 ${
                    gift.id === "live_gift_250"
                      ? "border-pink-400/60 bg-gradient-to-b from-pink-500/20 to-orange-400/10 shadow-[0_0_18px_rgba(255,45,155,.18)]"
                      : "border-white/10 bg-white/[0.04]"
                  } disabled:opacity-50`}
                >
                  <span className="text-3xl">{gift.icon}</span>
                  <span className="mt-1 text-[10px] font-bold text-white">
                    {gift.name}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300">
                    💎 {gift.cost}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
              <span className="text-[11px] text-white/50">Choose a gift to send</span>
              <span className="text-[11px] font-bold text-pink-300">250 Gift available</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
