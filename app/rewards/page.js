"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  CHECKIN_REWARDS,
  listenRewardStatus,
  claimDailyCheckin,
  LUCKY_BOX_COST,
  SPIN_WHEEL_COST,
  openLuckyBox,
  spinWheel,
} from "@/lib/rewards";

export default function RewardsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState({ streak: 0, lastCheckin: null });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lastPrize, setLastPrize] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    listenRewardStatus(user.uid, setStatus);
  }, [user]);

  async function handleCheckin() {
    setBusy(true);
    setMessage("");
    try {
      const res = await claimDailyCheckin(user.uid);
      if (res.alreadyClaimed) setMessage("Aaj ka check-in already claim ho chuka hai.");
      else {
        setMessage(`+${res.coinsAwarded} coins! Day ${res.streak} streak.`);
        setStatus((s) => ({ ...s, streak: res.streak, lastCheckin: new Date().toISOString().slice(0, 10) }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLuckyBox() {
    setBusy(true);
    setMessage("");
    try {
      const prize = await openLuckyBox(user.uid);
      setLastPrize({ box: "Lucky Box", ...prize });
    } catch (err) {
      setMessage(err.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSpin() {
    setBusy(true);
    setMessage("");
    try {
      const prize = await spinWheel(user.uid);
      setLastPrize({ box: "Spin Wheel", ...prize });
    } catch (err) {
      setMessage(err.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-void text-mist text-sm">Loading…</div>;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const claimedToday = status.lastCheckin === todayKey;

  return (
    <div className="min-h-screen bg-void pb-10">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-ink ring-1 ring-white/10">←</button>
        <h1 className="font-display text-base font-bold text-ink">Rewards</h1>
      </div>

      {message && <p className="mx-4 mb-2 text-[11px] text-neon-pink">{message}</p>}
      {lastPrize && (
        <p className="mx-4 mb-2 rounded-lg bg-gold/10 p-2 text-center text-xs font-semibold text-gold">
          {lastPrize.box}: {lastPrize.label} 🎉
        </p>
      )}

      {/* Daily check-in */}
      <div className="mx-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
        <h2 className="text-sm font-bold text-ink">Daily Check-in</h2>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {CHECKIN_REWARDS.map((coins, i) => {
            const day = i + 1;
            const active = ((status.streak - 1) % 7) + 1 === day && claimedToday;
            return (
              <div key={day} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-center ${active ? "bg-glow-gradient" : "bg-panel2"}`}>
                <span className="text-[9px] text-mist">D{day}</span>
                <span className="text-[10px] font-bold text-ink">{coins}</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleCheckin}
          disabled={busy || claimedToday}
          className="mt-3 w-full rounded-xl bg-glow-gradient py-2.5 text-sm font-bold text-ink disabled:opacity-50"
        >
          {claimedToday ? "Claimed Today ✓" : "Claim Today's Reward"}
        </button>
      </div>

      {/* Lucky box + spin wheel */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-panel p-4 text-center ring-1 ring-white/10">
          <p className="text-2xl">🎁</p>
          <p className="mt-1 text-xs font-semibold text-ink">Lucky Box</p>
          <p className="text-[10px] text-mist">{LUCKY_BOX_COST} coins</p>
          <button onClick={handleLuckyBox} disabled={busy || (profile?.coins || 0) < LUCKY_BOX_COST} className="mt-2 w-full rounded-full bg-glow-gradient py-2 text-xs font-bold text-ink disabled:opacity-40">
            Open
          </button>
        </div>
        <div className="rounded-2xl bg-panel p-4 text-center ring-1 ring-white/10">
          <p className="text-2xl">🎡</p>
          <p className="mt-1 text-xs font-semibold text-ink">Spin Wheel</p>
          <p className="text-[10px] text-mist">{SPIN_WHEEL_COST} coins</p>
          <button onClick={handleSpin} disabled={busy || (profile?.coins || 0) < SPIN_WHEEL_COST} className="mt-2 w-full rounded-full bg-glow-gradient py-2 text-xs font-bold text-ink disabled:opacity-40">
            Spin
          </button>
        </div>
      </div>
    </div>
  );
}
