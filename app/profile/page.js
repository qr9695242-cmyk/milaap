"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { vipLevelForSpend } from "@/lib/vip";
import { hostLevelForDiamonds } from "@/lib/hostLevel";
import { giftLevelForSpend, nextGiftLevel, giftLevelProgress } from "@/lib/giftLevel";
import { effectiveRole } from "@/lib/roles";
import { findItem } from "@/lib/decorations";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import FramedAvatar from "@/components/FramedAvatar";
import GiftLevelBadge from "@/components/GiftLevelBadge";
import { useInstall, isIOS } from "@/lib/InstallContext";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { installed, promptInstall } = useInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function handleInstallClick() {
    if (isIOS()) {
      setShowIosHelp((v) => !v);
      return;
    }
    await promptInstall();
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  const role = effectiveRole(user, profile);
  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";
  const vipTier = vipLevelForSpend(profile?.totalRechargedRs);
  const hostTier = hostLevelForDiamonds(profile?.diamonds);
  const giftTier = giftLevelForSpend(profile?.totalGiftedCoins);
  const nextGift = nextGiftLevel(profile?.totalGiftedCoins);
  const giftProgress = giftLevelProgress(profile?.totalGiftedCoins);
  const equippedVehicle = profile?.equippedVehicle ? findItem("vehicle", profile.equippedVehicle) : null;

  return (
    <main className="min-h-screen bg-void pb-28">
      <section className="bg-glow-gradient px-5 pb-8 pt-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <FramedAvatar frameId={profile?.equippedFrame} name={profile?.displayName} photoURL={profile?.avatar} size={64} />
            <div>
              <p className="font-display text-lg font-extrabold text-ink">
                {profile?.displayName || "User"} {equippedVehicle && <span title={equippedVehicle.name}>{equippedVehicle.emoji}</span>}
              </p>
              <p className="text-xs text-ink/80">{profile?.email}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-ink">
                  {vipTier.name}
                </span>
                <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-ink">
                  {hostTier.icon} {hostTier.name}
                </span>
                <GiftLevelBadge totalGiftedCoins={profile?.totalGiftedCoins} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile/edit"
              className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-ink"
            >
              Edit
            </Link>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
        {profile?.bio && <p className="mt-3 text-xs text-ink/80">{profile.bio}</p>}
      </section>

      <section className="mx-5 -mt-4 flex divide-x divide-white/5 rounded-xl bg-panel ring-1 ring-white/5">
        <Link href={`/u/${user.uid}/connections?tab=followers`} className="flex-1 py-3 text-center">
          <p className="font-display text-base font-extrabold text-ink">{profile?.followersCount ?? 0}</p>
          <p className="text-[10px] text-mist">Followers</p>
        </Link>
        <Link href={`/u/${user.uid}/connections?tab=following`} className="flex-1 py-3 text-center">
          <p className="font-display text-base font-extrabold text-ink">{profile?.followingCount ?? 0}</p>
          <p className="text-[10px] text-mist">Following</p>
        </Link>
        <div className="flex-1 py-3 text-center">
          <p className="font-display text-base font-extrabold text-gold">◆ {profile?.diamonds ?? 0}</p>
          <p className="text-[10px] text-mist">Diamonds</p>
        </div>
        <div className="flex-1 py-3 text-center">
          <p className="font-display text-base font-extrabold text-diamond">● {profile?.coins ?? 0}</p>
          <p className="text-[10px] text-mist">Coins</p>
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-xl bg-panel p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-ink">Gift Level</p>
          <p className="text-[10px] text-mist">
            ● {profile?.totalGiftedCoins ?? 0} gifted
          </p>
        </div>
        <div className="mt-2">
          <GiftLevelBadge totalGiftedCoins={profile?.totalGiftedCoins} />
        </div>
        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-panel2 shadow-3d-btn-active"
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.round(giftProgress * 100)}%`, backgroundImage: giftTier.gradient }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-mist">
          {nextGift
            ? `Lv.${nextGift.level} tak ${Math.max(0, nextGift.minCoins - (profile?.totalGiftedCoins ?? 0))} coins ka gift aur bhejna hai`
            : "Max level pahunch gaye — Immortal Patron! 🏆"}
        </p>
      </section>

      <section className="mx-5 mt-6 divide-y divide-white/5 rounded-xl bg-panel ring-1 ring-white/5">
        {[
          { label: "Wallet & Recharge", href: "/wallet" },
          { label: "VIP / SVIP", href: "/vip" },
          { label: "Daily Rewards / Lucky Box / Spin", href: "/rewards" },
          { label: "Family", href: "/family" },
          { label: "Agency", href: "/agency" },
          { label: "Help & Support", href: "/help" },
          { label: "Blocked Users", href: "/blocked" },
          { label: "Frames", href: "/profile/frames" },
          { label: "Vehicles / Cars", href: "/profile/vehicles" },
          { label: "Friends / CP", href: "/profile/friends" },
          { label: "Settings", href: "/settings" },
        ].map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-ink/90"
            >
              {item.label}
              <span className="text-mist">›</span>
            </Link>
          ) : (
            <div
              key={item.label}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-ink/40"
            >
              {item.label}
              <span className="rounded-full bg-panel2 px-2 py-0.5 text-[10px] text-mist">Soon</span>
            </div>
          )
        )}
        <button
          onClick={handleInstallClick}
          disabled={installed}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-ink/90 disabled:text-ink/40"
        >
          📲 Install App
          {installed ? (
            <span className="text-[10px] text-mist">Installed ✓</span>
          ) : (
            <span className="text-mist">›</span>
          )}
        </button>
        {showIosHelp && (
          <p className="px-4 py-3 text-xs text-mist">
            Share button (□↑) dabayein → <span className="font-semibold text-ink">"Add to Home Screen"</span> choose karein.
          </p>
        )}
      </section>

      {isAdmin && (
        <div className="mx-5 mt-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-xl bg-panel px-4 py-3 text-sm font-semibold text-gold ring-1 ring-gold/30"
          >
            Admin Panel
            <span>›</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center justify-between rounded-xl bg-panel px-4 py-3 text-sm font-semibold text-diamond ring-1 ring-diamond/30"
          >
            Analytics Dashboard
            <span>›</span>
          </Link>
          {isSuperAdmin && (
            <p className="px-1 text-[10px] text-mist">
              Signed in as Super Admin — you can manage other admins/moderators from the Admin Panel.
            </p>
          )}
        </div>
      )}

      <div className="mx-5 mt-6">
        <button
          onClick={() => signOut(auth)}
          className="w-full rounded-full bg-panel py-3 text-sm font-semibold text-neon-pink ring-1 ring-neon-pink/30"
        >
          Sign Out
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
