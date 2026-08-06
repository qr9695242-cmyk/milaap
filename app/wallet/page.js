"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { listenMyRecharges } from "@/lib/wallet";
import BottomNav from "@/components/BottomNav";

const STATUS_STYLES = {
  pending: "bg-gold/20 text-gold",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-neon-pink/20 text-neon-pink",
};

export default function WalletPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [recharges, setRecharges] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenMyRecharges(user.uid, setRecharges);
    return () => unsub();
  }, [user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pb-24">
      <header className="px-5 pt-6">
        <h1 className="font-display text-xl font-extrabold text-ink">Wallet</h1>
      </header>

      <section className="mx-5 mt-4 rounded-2xl bg-glow-gradient p-5 shadow-glow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-ink/80">Coins</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">
              ● {profile?.coins ?? 0}
            </p>
            <p className="text-[10px] text-ink/70">Spend on gifts</p>
          </div>
          <div>
            <p className="text-xs text-ink/80">Diamonds</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">
              ◆ {profile?.diamonds ?? 0}
            </p>
            <p className="text-[10px] text-ink/70">Earned from gifts received</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/wallet/recharge"
            className="rounded-full bg-white/95 py-2.5 text-center text-sm font-semibold text-void"
          >
            Recharge Coins
          </Link>
          <Link
            href="/wallet/withdraw"
            className="rounded-full bg-void/30 py-2.5 text-center text-sm font-semibold text-ink ring-1 ring-white/30"
          >
            Withdraw Diamonds
          </Link>
        </div>
      </section>

      <section className="mx-5 mt-6">
        <h2 className="font-display text-sm font-bold text-ink">
          Recharge History
        </h2>
        {recharges.length === 0 ? (
          <p className="mt-3 text-xs text-mist">No recharges yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {recharges.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-panel p-3 ring-1 ring-white/5"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {r.coins} coins
                  </p>
                  <p className="text-xs text-mist">
                    Rs {r.priceRs} · {r.method}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
                    STATUS_STYLES[r.status] || "bg-panel2 text-mist"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
