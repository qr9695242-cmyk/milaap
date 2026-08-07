"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { VEHICLE_CATALOG, RARITY_STYLE, purchaseDecoration, equipDecoration } from "@/lib/decorations";
import BottomNav from "@/components/BottomNav";
import DecorationArt from "@/components/DecorationArt";

export default function VehiclesShopPage() {
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

  const owned = profile?.ownedVehicles || [];
  const equipped = profile?.equippedVehicle || null;
  const coins = profile?.coins ?? 0;

  async function handleAction(item) {
    setError(null);
    setMessage(null);
    setBusyId(item.id);
    try {
      const isOwned = item.free || owned.includes(item.id);
      if (!isOwned) {
        await purchaseDecoration(user.uid, "vehicle", item.id);
        setMessage(`${item.name} purchased & equipped!`);
      } else {
        setMessage(`${item.name} equipped!`);
      }
      await equipDecoration(user.uid, "vehicle", item.id);
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
            <h1 className="font-display text-lg font-extrabold text-ink">Vehicles / Cars</h1>
            <p className="text-xs text-ink/80">Ride in style when you enter a room</p>
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

      <section className="mx-5 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VEHICLE_CATALOG.map((item) => {
          const isOwned = item.free || owned.includes(item.id);
          const isEquipped = item.free ? !equipped : equipped === item.id;
          const style = RARITY_STYLE[item.rarity];

          const frameColors = {
            common: "#cbd5e1",
            rare: "#38bdf8",
            epic: "#c084fc",
            legendary: "#f5c34d",
            mythic: "#ff3b9d",
          };
          const frameColor = frameColors[item.rarity] || "#cbd5e1";

          return (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl bg-[#090b18] p-2 shadow-2xl ring-1 ring-white/10"
              style={{
                boxShadow: `0 0 0 1px ${frameColor}55, 0 0 24px ${frameColor}22`,
              }}
            >
              {/* Real-photo frame */}
              <div
                className="relative overflow-hidden rounded-xl border-[5px] bg-black"
                style={{
                  borderColor: frameColor,
                  boxShadow: `inset 0 0 0 2px rgba(255,255,255,.18), inset 0 0 24px ${frameColor}35`,
                }}
              >
                <div
                  className="absolute left-1 top-1 z-10 h-5 w-5 border-l-2 border-t-2"
                  style={{ borderColor: frameColor }}
                />
                <div
                  className="absolute right-1 top-1 z-10 h-5 w-5 border-r-2 border-t-2"
                  style={{ borderColor: frameColor }}
                />
                <div
                  className="absolute bottom-1 left-1 z-10 h-5 w-5 border-b-2 border-l-2"
                  style={{ borderColor: frameColor }}
                />
                <div
                  className="absolute bottom-1 right-1 z-10 h-5 w-5 border-b-2 border-r-2"
                  style={{ borderColor: frameColor }}
                />

                <img
                  src={`/vehicle-frames/${item.id}.jpg`}
                  alt={item.name}
                  className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />

                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#070914] via-[#070914cc] to-transparent" />
              </div>

              <div className="px-2 pb-2 pt-3">
                <p className="text-center text-sm font-extrabold text-ink">{item.name}</p>
                <p
                  className="mt-1 text-center text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ color: frameColor }}
                >
                  {style.label}
                </p>

                {!item.free && (
                  <p className="mt-1 text-center text-sm font-black text-diamond">
                    ◆ {item.priceCoins}
                  </p>
                )}

                <button
                  onClick={() => handleAction(item)}
                  disabled={busyId === item.id || isEquipped}
                  className={`mt-3 w-full rounded-full px-3 py-2 text-xs font-extrabold transition ${
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
            </div>
          );
        })}
      </section>

      <BottomNav />
    </main>
  );
}
