"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import SearchLink from "@/components/SearchLink";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

// Placeholder rooms — Phase 2 me ye Firestore/Agora se live data se replace hoga
const DEMO_ROOMS = [
  { id: "r1", title: "Late Night Chill", host: "Ayesha", viewers: 812, tag: "Live" },
  { id: "r3", title: "Music Lounge", host: "DJ Noor", viewers: 356, tag: "Audio" },
  { id: "r4", title: "Game Night", host: "Team Falcon", viewers: 209, tag: "Live" },
];

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6">
        <div>
          <p className="text-xs text-mist">Welcome back</p>
          <h1 className="font-display text-xl font-extrabold text-ink">
            {profile?.displayName || "Guest"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-full bg-panel px-3 py-1.5 text-xs">
            <span className="flex items-center gap-1 text-gold">
              ◆ {profile?.diamonds ?? 0}
            </span>
            <span className="flex items-center gap-1 text-diamond">
              ● {profile?.coins ?? 0}
            </span>
          </div>
          <SearchLink />
          <NotificationBell />
          <ThemeToggle />
        </div>
      </header>

      {/* Hero banner */}
      <section className="mx-5 mt-6 overflow-hidden rounded-2xl bg-glow-gradient p-5 shadow-glow">
        <p className="font-display text-lg font-extrabold text-ink">
          Go Live in seconds
        </p>
        <p className="mt-1 text-sm text-ink/80">
          Start streaming or open an audio room and connect live.
        </p>
        <Link
          href="/rooms"
          className="mt-4 inline-block rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-void"
        >
          Start Streaming
        </Link>
      </section>

      {/* Live rooms grid */}
      <section className="mt-8 px-5">
        <h2 className="font-display text-sm font-bold text-ink">
          Live Now
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {DEMO_ROOMS.map((room) => (
            <div
              key={room.id}
              className="rounded-xl bg-panel p-3 shadow-sm ring-1 ring-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-neon-pink/20 px-2 py-0.5 text-[10px] font-semibold text-neon-pink">
                  {room.tag}
                </span>
                <span className="text-[10px] text-mist">{room.viewers} 👁</span>
              </div>
              <p className="mt-2 truncate font-display text-sm font-bold text-ink">
                {room.title}
              </p>
              <p className="truncate text-xs text-mist">{room.host}</p>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
