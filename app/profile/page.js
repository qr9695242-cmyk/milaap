"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { giftLevelForSpend, giftLevelProgress, nextGiftLevel } from "@/lib/giftLevel";
import { hostLevelForDiamonds, hostLevelProgress, nextHostLevel } from "@/lib/hostLevel";
import { VIP_TIERS } from "@/lib/vip";
import FramedAvatar from "@/components/FramedAvatar";
import GiftLevelBadge from "@/components/GiftLevelBadge";
import HostLevelBadge from "@/components/HostLevelBadge";
import VipBadge from "@/components/VipBadge";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || !profile) {
    return <div className="flex min-h-screen items-center justify-center bg-void text-mist text-sm">Loading…</div>;
  }

  const giftTier = giftLevelForSpend(profile.totalGiftedCoins || 0);
  const giftNext = nextGiftLevel(profile.totalGiftedCoins || 0);
  const giftProgress = giftLevelProgress(profile.totalGiftedCoins || 0);

  const hostTier = hostLevelForDiamonds(profile.diamonds || 0);
  const hostNext = nextHostLevel(profile.diamonds || 0);
  const hostProgress = hostLevelProgress(profile.diamonds || 0);

  const vipTier = VIP_TIERS[Math.max(0, Math.min(profile.vipLevel || 0, VIP_TIERS.length - 1))];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-void pb-24">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="font-display text-base font-bold text-ink">Profile</h1>
        <ThemeToggle />
      </div>

      {/* Identity */}
      <div className="mx-4 flex items-center gap-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
        <FramedAvatar frameId={profile.equippedFrame} name={profile.displayName} photoURL={profile.avatar} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-ink">{profile.displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <GiftLevelBadge totalGiftedCoins={profile.totalGiftedCoins || 0} compact />
            <HostLevelBadge diamonds={profile.diamonds || 0} compact />
            {vipTier?.level > 0 && <VipBadge vipLevel={profile.vipLevel || 0} compact />}
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-mist">
            <span><span className="font-semibold text-ink">{profile.followersCount || 0}</span> Followers</span>
            <span><span className="font-semibold text-ink">{profile.followingCount || 0}</span> Following</span>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <Link href="/wallet" className="rounded-2xl bg-panel p-4 ring-1 ring-white/10">
          <p className="text-[11px] text-mist">Coins</p>
          <p className="mt-1 text-lg font-bold text-gold">● {(profile.coins ?? 0).toLocaleString()}</p>
        </Link>
        <Link href="/wallet" className="rounded-2xl bg-panel p-4 ring-1 ring-white/10">
          <p className="text-[11px] text-mist">Diamonds</p>
          <p className="mt-1 text-lg font-bold text-diamond">💎 {(profile.diamonds ?? 0).toLocaleString()}</p>
        </Link>
      </div>

      {/* Gift Level progress */}
      <div className="mx-4 mt-3 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">{giftTier.icon} Gift Level {giftTier.level}</p>
          <p className="text-[11px] text-mist">{giftTier.name}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel2">
          <div className="h-full rounded-full bg-glow-gradient" style={{ width: `${Math.round(giftProgress * 100)}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-mist">
          {giftNext
            ? `${(profile.totalGiftedCoins || 0).toLocaleString()} / ${giftNext.minCoins.toLocaleString()} coins gifted to reach Lv.${giftNext.level}`
            : "Max level reached 🏆"}
        </p>
      </div>

      {/* Host Level progress */}
      <div className="mx-4 mt-3 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">{hostTier.icon} {hostTier.name}</p>
          <p className="text-[11px] text-mist">Lv.{hostTier.level}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel2">
          <div className="h-full rounded-full bg-glow-gradient" style={{ width: `${Math.round(hostProgress * 100)}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-mist">
          {hostNext
            ? `${(profile.diamonds || 0).toLocaleString()} / ${hostNext.minDiamonds.toLocaleString()} diamonds received`
            : "Max level reached 🔥"}
        </p>
      </div>

      {/* Links */}
      <div className="mx-4 mt-4 divide-y divide-white/5 rounded-2xl bg-panel ring-1 ring-white/10">
        {[
          { href: "/vip", label: "VIP / SVIP", icon: "👑" },
          { href: "/rewards", label: "Daily Rewards", icon: "🎁" },
          { href: "/family", label: "Family", icon: "👪" },
          { href: "/agency", label: "Agency", icon: "🏢" },
          { href: "/wallet", label: "Wallet", icon: "💰" },
          { href: "/notifications", label: "Notifications", icon: "🔔" },
          { href: "/blocked", label: "Blocked Users", icon: "🚫" },
          { href: "/help", label: "Help & Support", icon: "❓" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 text-sm text-ink">
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <span className="text-mist">›</span>
          </Link>
        ))}
      </div>

      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="mx-4 mt-4 w-full rounded-xl bg-panel py-3 text-center text-sm font-semibold text-neon-pink ring-1 ring-white/10 disabled:opacity-50"
      >
        {signingOut ? "Signing out…" : "Sign Out"}
      </button>

      <BottomNav />
    </div>
  );
}
