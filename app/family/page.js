"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { createFamily, listenFamily, listenFamilyLeaderboard, joinFamily, leaveFamily, contributeToFamily } from "@/lib/family";

export default function FamilyPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [family, setFamily] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("100");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const unsub = listenFamilyLeaderboard(setLeaderboard);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!profile?.familyId) {
      setFamily(null);
      return;
    }
    return listenFamily(profile.familyId, setFamily);
  }, [profile?.familyId]);

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      await createFamily({ name: name.trim(), leaderId: user.uid, leaderName: profile?.displayName || "User" });
      setName("");
    } catch (err) {
      setMessage(err.message || "Family create nahi ho saki.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(f) {
    setBusy(true);
    setMessage("");
    try {
      await joinFamily(f.id, user.uid, profile?.displayName || "User");
    } catch (err) {
      setMessage(err.message || "Join nahi ho saka.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!family) return;
    setBusy(true);
    try {
      await leaveFamily(family.id, { uid: user.uid, name: profile?.displayName || "User" });
    } finally {
      setBusy(false);
    }
  }

  async function handleContribute() {
    if (!family) return;
    const amt = Number(contribution);
    if (!amt || amt <= 0) return;
    setBusy(true);
    setMessage("");
    try {
      await contributeToFamily(family.id, user.uid, amt);
    } catch (err) {
      setMessage(err.message || "Contribute nahi ho saka.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-void text-mist text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-void pb-10">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-ink ring-1 ring-white/10">←</button>
        <h1 className="font-display text-base font-bold text-ink">Family</h1>
      </div>

      {message && <p className="mx-4 mb-2 text-[11px] text-neon-pink">{message}</p>}

      {family ? (
        <div className="mx-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">{family.name}</p>
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold">Lv.{family.level}</span>
          </div>
          <p className="mt-1 text-[11px] text-mist">💎 {(family.totalDiamonds || 0).toLocaleString()} total</p>
          <p className="mt-2 text-[11px] text-mist">{family.members?.length || 0} members</p>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              className="w-24 rounded-lg bg-panel2 px-3 py-2 text-sm text-ink outline-none ring-1 ring-white/10"
            />
            <button onClick={handleContribute} disabled={busy} className="flex-1 rounded-xl bg-glow-gradient py-2 text-xs font-bold text-ink disabled:opacity-50">
              Contribute 💎
            </button>
          </div>
          {family.leaderId !== user.uid && (
            <button onClick={handleLeave} disabled={busy} className="mt-2 w-full rounded-xl bg-panel2 py-2 text-xs text-neon-pink disabled:opacity-50">
              Leave Family
            </button>
          )}
        </div>
      ) : (
        <div className="mx-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
          <p className="text-sm text-ink">Aap kisi family mein nahi hain.</p>
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Family name"
              className="flex-1 rounded-lg bg-panel2 px-3 py-2 text-sm text-ink outline-none ring-1 ring-white/10"
            />
            <button onClick={handleCreate} disabled={busy} className="rounded-xl bg-glow-gradient px-4 py-2 text-xs font-bold text-ink disabled:opacity-50">
              Create
            </button>
          </div>
        </div>
      )}

      <div className="mx-4 mt-5">
        <h2 className="mb-2 text-sm font-bold text-ink">Leaderboard</h2>
        <div className="space-y-2">
          {leaderboard.map((f, i) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl bg-panel p-3 ring-1 ring-white/5">
              <div className="flex items-center gap-2">
                <span className="w-5 text-center text-xs font-bold text-mist">#{i + 1}</span>
                <span className="text-sm text-ink">{f.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {!profile?.familyId && f.id !== profile?.familyId && (
                  <button onClick={() => handleJoin(f)} disabled={busy} className="rounded-full bg-panel2 px-2.5 py-1 text-[10px] text-ink ring-1 ring-white/10 disabled:opacity-50">
                    Join
                  </button>
                )}
                <span className="text-xs text-gold">💎 {(f.totalDiamonds || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
