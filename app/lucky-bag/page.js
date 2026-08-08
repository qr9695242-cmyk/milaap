"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { openLuckyBag, luckyBagCooldownRemaining } from "@/lib/luckyBag";
import BottomNav from "@/components/BottomNav";

function formatCooldown(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function LuckyBagPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState("idle"); // idle | opening | won
  const [wonAmount, setWonAmount] = useState(null);
  const [error, setError] = useState(null);
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile) return;
    setCooldownMs(luckyBagCooldownRemaining(profile.lastLuckyBagAt));
  }, [profile]);

  // Tick the cooldown display down every minute so it doesn't feel stuck.
  useEffect(() => {
    if (cooldownMs <= 0) return;
    const t = setInterval(() => setCooldownMs((ms) => Math.max(0, ms - 60000)), 60000);
    return () => clearInterval(t);
  }, [cooldownMs]);

  async function handleOpen() {
    if (!user || cooldownMs > 0 || state === "opening") return;
    setError(null);
    setState("opening");
    try {
      // Small suspense beat before revealing the reward.
      await new Promise((r) => setTimeout(r, 900));
      const { amount } = await openLuckyBag(user.uid);
      setWonAmount(amount);
      setState("won");
      setCooldownMs(24 * 60 * 60 * 1000);
    } catch (e) {
      setError(e.message);
      setState("idle");
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  const canOpen = cooldownMs <= 0 && state !== "won";

  return (
    <main className="min-h-screen bg-void pb-28">
      <section className="bg-glow-gradient px-5 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-ink text-lg">‹</Link>
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink">Weekend Lucky Bag</h1>
            <p className="text-xs text-ink/80">One free bag every day — good luck!</p>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-10 flex flex-col items-center">
        <button
          onClick={handleOpen}
          disabled={!canOpen}
          className={`relative flex h-40 w-40 items-center justify-center rounded-3xl text-6xl shadow-glow transition-transform active:scale-95 ${
            state === "opening" ? "animate-bounce" : ""
          } ${canOpen ? "bg-glow-gradient" : "bg-panel opacity-60"}`}
        >
          {state === "won" ? "🎉" : "🎁"}
        </button>

        <p className="mt-6 text-center text-sm text-mist">
          {state === "idle" && canOpen && "Tap the bag to open it"}
          {state === "opening" && "Opening…"}
          {state === "won" && "You won:"}
          {!canOpen && state !== "won" && "Come back later for your next bag"}
        </p>

        {state === "won" && wonAmount != null && (
          <p className="mt-2 font-display text-3xl font-extrabold text-diamond">
            ● {wonAmount} coins
          </p>
        )}

        {error && <p className="mt-3 text-sm text-neon-pink">{error}</p>}

        {!canOpen && cooldownMs > 0 && (
          <p className="mt-4 rounded-full bg-panel px-4 py-2 text-xs text-mist ring-1 ring-white/5">
            Next bag in {formatCooldown(cooldownMs)}
          </p>
        )}

        {state === "won" && (
          <Link
            href="/"
            className="mt-8 rounded-full bg-panel px-6 py-3 text-sm font-semibold text-ink ring-1 ring-white/10"
          >
            Back to Home
          </Link>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
