"use client";

import { useState } from "react";
import { GIFT_CATALOG, sendGift } from "@/lib/gifts";
import { addBattleScore } from "@/lib/pkbattle";

export default function GiftBar({ roomId, fromUid, fromName, toUid, toName, myCoins, activeBattle, battleSide }) {
  const [sending, setSending] = useState(null);
  const [error, setError] = useState("");

  async function handleSend(gift) {
    setError("");
    if (myCoins < gift.cost) {
      setError("Not enough coins — recharge from Wallet.");
      return;
    }
    setSending(gift.id);
    try {
      await sendGift(roomId, { fromUid, fromName, toUid, toName, gift });
      if (activeBattle && battleSide) {
        await addBattleScore(activeBattle.id, battleSide, gift.cost);
      }
    } catch (err) {
      setError(err.message || "Could not send gift.");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="border-t border-white/5 px-3 py-2">
      {error && <p className="mb-1 text-[11px] text-neon-pink">{error}</p>}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {GIFT_CATALOG.map((gift) => (
          <button
            key={gift.id}
            onClick={() => handleSend(gift)}
            disabled={sending === gift.id}
            className="flex min-w-[64px] flex-col items-center rounded-xl bg-panel px-2 py-2 ring-1 ring-white/5 disabled:opacity-50"
          >
            <span className="text-xl">{gift.icon}</span>
            <span className="mt-1 text-[10px] text-ink">{gift.name}</span>
            <span className="text-[10px] text-gold">● {gift.cost}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
