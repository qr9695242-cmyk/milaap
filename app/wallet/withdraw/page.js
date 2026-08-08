"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { submitWithdrawRequest, diamondsToRs } from "@/lib/wallet";
import { MIN_WITHDRAW_DIAMONDS, DIAMOND_WITHDRAW_RATE_RS, SUPPORT_CONFIG } from "@/lib/config";

export default function WithdrawPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [diamonds, setDiamonds] = useState(String(MIN_WITHDRAW_DIAMONDS));
  const [method, setMethod] = useState(SUPPORT_CONFIG.paymentMethods[0]?.name || "JazzCash");
  const [accountNumber, setAccountNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setMessage("");
    const amt = Number(diamonds);
    if (!amt || amt < MIN_WITHDRAW_DIAMONDS) {
      setMessage(`Minimum withdraw ${MIN_WITHDRAW_DIAMONDS} diamonds hai.`);
      return;
    }
    if ((profile?.diamonds || 0) < amt) {
      setMessage("Itni diamonds nahi hain aapke paas.");
      return;
    }
    if (!accountNumber.trim()) {
      setMessage("Account number required hai.");
      return;
    }
    setBusy(true);
    try {
      await submitWithdrawRequest({
        uid: user.uid,
        name: profile?.displayName || "User",
        diamonds: amt,
        method,
        accountNumber: accountNumber.trim(),
      });
      setDone(true);
    } catch (err) {
      setMessage(err.message || "Request submit nahi ho saki.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-void pb-10">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-ink ring-1 ring-white/10">
          ←
        </button>
        <h1 className="font-display text-base font-bold text-ink">Withdraw</h1>
      </div>

      {done ? (
        <div className="mx-4 mt-10 rounded-2xl bg-panel p-6 text-center ring-1 ring-white/10">
          <p className="text-sm text-ink">Request submit ho gayi ✅</p>
          <p className="mt-1 text-xs text-mist">Admin approve karega, phir payment {method} par bheja jayega.</p>
          <button onClick={() => router.push("/wallet")} className="mt-4 rounded-full bg-glow-gradient px-4 py-2 text-xs font-bold text-ink">
            Back to Wallet
          </button>
        </div>
      ) : (
        <div className="mx-4 mt-2 space-y-4">
          <p className="text-xs text-mist">
            Balance: 💎 {(profile?.diamonds ?? 0).toLocaleString()} · Rate: Rs {DIAMOND_WITHDRAW_RATE_RS} per diamond
          </p>

          <div>
            <label className="mb-1 block text-[11px] text-mist">Diamonds to withdraw</label>
            <input
              type="number"
              min={MIN_WITHDRAW_DIAMONDS}
              value={diamonds}
              onChange={(e) => setDiamonds(e.target.value)}
              className="w-full rounded-xl bg-panel2 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-white/10"
            />
            <p className="mt-1 text-[11px] text-gold">≈ Rs {diamondsToRs(Number(diamonds) || 0).toLocaleString()}</p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-mist">Payment method</label>
            <div className="flex gap-2">
              {SUPPORT_CONFIG.paymentMethods.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setMethod(m.name)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ${
                    method === m.name ? "bg-glow-gradient text-ink" : "bg-panel text-mist ring-1 ring-white/10"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-mist">Your {method} number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="03xx-xxxxxxx"
              className="w-full rounded-xl bg-panel2 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-white/10"
            />
          </div>

          {message && <p className="text-[11px] text-neon-pink">{message}</p>}

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-xl bg-glow-gradient py-3 text-sm font-bold text-ink disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit Withdraw Request"}
          </button>
        </div>
      )}
    </div>
  );
}
