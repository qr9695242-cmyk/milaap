"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  listenMyRecharges,
  listenMyWithdrawals,
  exchangeDiamondsToCoins,
  diamondsToCoins,
} from "@/lib/wallet";
import { MIN_EXCHANGE_DIAMONDS, DIAMOND_TO_COIN_RATE } from "@/lib/config";
import BottomNav from "@/components/BottomNav";

export default function WalletPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [recharges, setRecharges] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [exchangeAmount, setExchangeAmount] = useState(String(MIN_EXCHANGE_DIAMONDS));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub1 = listenMyRecharges(user.uid, setRecharges);
    const unsub2 = listenMyWithdrawals(user.uid, setWithdrawals);
    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  async function handleExchange() {
    setMessage("");
    const diamonds = Number(exchangeAmount);
    if (!diamonds || diamonds < MIN_EXCHANGE_DIAMONDS) {
      setMessage(`Minimum ${MIN_EXCHANGE_DIAMONDS} diamonds chahiye.`);
      return;
    }
    setBusy(true);
    try {
      const { coinsGained } = await exchangeDiamondsToCoins(user.uid, diamonds);
      setMessage(`${coinsGained.toLocaleString()} coins mil gaye!`);
    } catch (err) {
      setMessage(err.message || "Exchange fail ho gaya.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-void text-mist text-sm">Loading…</div>;
  }

  const previewCoins = diamondsToCoins(Number(exchangeAmount) || 0);

  return (
    <div className="min-h-screen bg-void pb-24">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-ink ring-1 ring-white/10">
          ←
        </button>
        <h1 className="font-display text-base font-bold text-ink">Wallet</h1>
      </div>

      <div className="mx-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-panel p-4 ring-1 ring-white/10">
          <p className="text-[11px] text-mist">Coins</p>
          <p className="mt-1 text-xl font-bold text-gold">● {(profile?.coins ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-panel p-4 ring-1 ring-white/10">
          <p className="text-[11px] text-mist">Diamonds</p>
          <p className="mt-1 text-xl font-bold text-diamond">💎 {(profile?.diamonds ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="mx-4 mt-3 flex gap-2">
        <Link href="/wallet/recharge" className="flex-1 rounded-xl bg-glow-gradient py-3 text-center text-sm font-bold text-ink">
          Recharge
        </Link>
        <Link href="/wallet/withdraw" className="flex-1 rounded-xl bg-panel py-3 text-center text-sm font-bold text-ink ring-1 ring-white/10">
          Withdraw
        </Link>
      </div>

      <div className="mx-4 mt-5 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
        <h2 className="text-sm font-bold text-ink">Diamond → Coin Exchange</h2>
        <p className="mt-1 text-[11px] text-mist">
          {DIAMOND_TO_COIN_RATE} coins per diamond, turant convert hota hai (koi approval nahi chahiye).
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={MIN_EXCHANGE_DIAMONDS}
            value={exchangeAmount}
            onChange={(e) => setExchangeAmount(e.target.value)}
            className="w-28 rounded-lg bg-panel2 px-3 py-2 text-sm text-ink outline-none ring-1 ring-white/10"
          />
          <span className="text-xs text-mist">diamonds → {previewCoins.toLocaleString()} coins</span>
        </div>
        {message && <p className="mt-2 text-[11px] text-neon-pink">{message}</p>}
        <button
          onClick={handleExchange}
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-glow-gradient py-2.5 text-sm font-bold text-ink disabled:opacity-50"
        >
          {busy ? "Converting…" : "Exchange"}
        </button>
      </div>

      <div className="mx-4 mt-5">
        <h2 className="mb-2 text-sm font-bold text-ink">Recharge History</h2>
        <div className="space-y-2">
          {recharges.length === 0 && <p className="text-xs text-mist">Koi recharge nahi hui abhi.</p>}
          {recharges.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl bg-panel p-3 ring-1 ring-white/5">
              <div>
                <p className="text-sm text-ink">{r.coins?.toLocaleString()} coins</p>
                <p className="text-[10px] text-mist">Rs {r.priceRs} · {r.method}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  r.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : r.status === "rejected" ? "bg-neon-pink/20 text-neon-pink" : "bg-gold/20 text-gold"
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-5">
        <h2 className="mb-2 text-sm font-bold text-ink">Withdraw History</h2>
        <div className="space-y-2">
          {withdrawals.length === 0 && <p className="text-xs text-mist">Koi withdrawal nahi hui abhi.</p>}
          {withdrawals.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl bg-panel p-3 ring-1 ring-white/5">
              <div>
                <p className="text-sm text-ink">💎 {w.diamonds?.toLocaleString()}</p>
                <p className="text-[10px] text-mist">Rs {w.payoutRs} · {w.method}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  w.status === "paid" ? "bg-emerald-500/20 text-emerald-400" : w.status === "rejected" ? "bg-neon-pink/20 text-neon-pink" : "bg-gold/20 text-gold"
                }`}
              >
                {w.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
