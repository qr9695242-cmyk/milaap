"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { VIP_TIERS, nextVipTier } from "@/lib/vip";

export default function VipPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-void text-mist text-sm">Loading…</div>;
  }

  const myLevel = profile?.vipLevel || 0;
  const myTier = VIP_TIERS[Math.max(0, Math.min(myLevel, VIP_TIERS.length - 1))];
  const next = nextVipTier(profile?.totalRechargedRs || 0);

  return (
    <div className="min-h-screen bg-void pb-10">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-ink ring-1 ring-white/10">←</button>
        <h1 className="font-display text-base font-bold text-ink">VIP / SVIP</h1>
      </div>

      <div className="mx-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
        <p className="text-sm text-mist">Your tier</p>
        <p className="mt-1 text-xl font-bold" style={{ color: myTier.color }}>{myTier.name}</p>
        <p className="mt-1 text-[11px] text-mist">Lifetime recharge: Rs {(profile?.totalRechargedRs || 0).toLocaleString()}</p>
        {next && (
          <p className="mt-2 text-[11px] text-gold">
            {(next.minSpendRs - (profile?.totalRechargedRs || 0)).toLocaleString()} Rs more to reach {next.name}
          </p>
        )}
      </div>

      <div className="mx-4 mt-4 space-y-3">
        {VIP_TIERS.filter((t) => t.level > 0).map((tier) => (
          <div
            key={tier.level}
            className={`rounded-2xl p-4 ring-1 ${myLevel === tier.level ? "ring-2" : "ring-white/10"}`}
            style={{ background: `${tier.color}14`, borderColor: tier.color, ...(myLevel === tier.level ? { boxShadow: `0 0 0 1px ${tier.color}` } : {}) }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: tier.color }}>{tier.name}</p>
              <p className="text-[11px] text-mist">Rs {tier.minSpendRs.toLocaleString()}+</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {tier.emojis.map((e) => (
                <span key={e} className="rounded-full bg-panel px-2 py-0.5 text-sm ring-1 ring-white/5">{e}</span>
              ))}
            </div>
            <ul className="mt-2 space-y-1 text-[11px] text-mist">
              {tier.entryEffect && <li>✓ Special room entry effect</li>}
              {tier.prioritySeat && <li>✓ Priority seat when room is full</li>}
              <li>✓ Exclusive chat emojis</li>
            </ul>
          </div>
        ))}
      </div>

      <p className="mx-4 mt-4 text-center text-[11px] text-mist">
        Recharge from Wallet to increase your lifetime spend and level up automatically.
      </p>
    </div>
  );
}
