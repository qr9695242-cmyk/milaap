"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { FRAME_CATALOG, RARITY_STYLE, purchaseDecoration, equipDecoration, setFrameBackground } from "@/lib/decorations";
import AvatarFrame from "@/components/AvatarFrame";
import BottomNav from "@/components/BottomNav";

export default function FramesShopPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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

  const owned = profile?.ownedFrames || [];
  const equipped = profile?.equippedFrame || null;
  const coins = profile?.coins ?? 0;
  const frameBackground = profile?.frameBackground || "aurora";
  const backgrounds = {
    aurora: "linear-gradient(135deg,#24123f,#6d1f7b 48%,#15112c)",
    royal: "linear-gradient(135deg,#15100a,#5b3a0a 48%,#17120a)",
    ocean: "linear-gradient(135deg,#071d35,#075985 48%,#08131f)",
    ruby: "linear-gradient(135deg,#300810,#8f1239 48%,#190710)",
  };

  async function handleAction(item) {
    setError(null);
    setMessage(null);
    setBusyId(item.id);
    try {
      const isOwned = item.free || owned.includes(item.id);
      if (!isOwned) {
        await purchaseDecoration(user.uid, "frame", item.id);
        setMessage(`${item.name} purchased & equipped!`);
      } else {
        setMessage(`${item.name} equipped!`);
      }
      await equipDecoration(user.uid, "frame", item.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-void pb-28">
      <section className="bg-glow-gradient px-5 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-ink text-lg">‹</Link>
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink">Frames</h1>
            <p className="text-xs text-ink/80">Equip an avatar ring — shows everywhere you appear</p>
          </div>
        </div>
      </section>

      <div className="mx-5 mt-4 flex items-center justify-between rounded-xl bg-panel px-4 py-3 ring-1 ring-white/5">
        <span className="text-sm text-mist">Your Coins</span>
        <span className="font-display text-base font-extrabold text-diamond">● {coins}</span>
      </div>

      {(error || message) && (
        <p className={`mx-5 mt-3 text-sm ${error ? "text-neon-pink" : "text-diamond"}`}>
          {error || message}
        </p>
      )}

      <section className="mx-5 mt-4 rounded-2xl bg-panel p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-extrabold text-ink">Frame Background</h2>
            <p className="mt-0.5 text-[10px] text-mist">Choose the background behind your premium frame</p>
          </div>
          <span className="text-[10px] font-bold text-diamond">{frameBackground.toUpperCase()}</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {Object.entries(backgrounds).map(([id, bg]) => (
            <button
              key={id}
              type="button"
              className={`frame-bg-option ${frameBackground === id ? "active" : ""}`}
              style={{ background: bg }}
              onClick={async () => {
                setError(null);
                try { await setFrameBackground(user.uid, id); } catch (e) { setError(e.message); }
              }}
              aria-label={`Use ${id} frame background`}
            />
          ))}
        </div>
      </section>

      <section className="mx-5 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FRAME_CATALOG.map((item) => {
          const isOwned = item.free || owned.includes(item.id);
          const isEquipped = item.free ? !equipped : equipped === item.id;
          const style = RARITY_STYLE[item.rarity];
          return (
            <div
              key={item.id}
              className={`frame-card flex flex-col items-center rounded-2xl bg-panel p-3 ring-1 ${style.ring} ${style.glow}`}
            >
              <div
                className="frame-shop-preview"
                style={{ "--frame-gradient": item.free ? "linear-gradient(135deg,#30303a,#111118)" : item.gradient }}
              >
                <AvatarFrame
                  name={profile?.displayName || "User"}
                  src={profile?.avatar || user.photoURL || ""}
                  frame={item.free ? null : item}
                  background={backgrounds[frameBackground]}
                  size="md"
                />
              </div>
              <p className="mt-2 line-clamp-1 text-center text-[11px] font-semibold text-ink">{item.name}</p>
              <p className="text-[9px] uppercase tracking-wide text-mist">{style.label}</p>
              {!item.free && (
                <p className="mt-1 text-[10px] font-bold text-diamond">● {item.priceCoins}</p>
              )}
              <button
                onClick={() => handleAction(item)}
                disabled={busyId === item.id || isEquipped}
                className={`mt-2 w-full rounded-full px-2 py-1 text-[10px] font-bold ${
                  isEquipped
                    ? "bg-panel2 text-mist"
                    : isOwned
                    ? "bg-diamond/20 text-diamond"
                    : "bg-glow-gradient text-ink"
                } disabled:opacity-60`}
              >
                {busyId === item.id ? "…" : isEquipped ? "Equipped" : isOwned ? "Equip" : "Buy"}
              </button>
            </div>
          );
        })}
      </section>

      <BottomNav />
    </main>
  );
}
