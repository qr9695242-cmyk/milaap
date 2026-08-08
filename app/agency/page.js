"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { createAgency, joinAgencyByCode, leaveAgency, listenAgency, listenAgencyMembers } from "@/lib/agency";

export default function AgencyPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [agency, setAgency] = useState(null);
  const [members, setMembers] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile?.agencyId) {
      setAgency(null);
      setMembers([]);
      return;
    }
    const unsub1 = listenAgency(profile.agencyId, setAgency);
    const unsub2 = listenAgencyMembers(profile.agencyId, setMembers);
    return () => {
      unsub1();
      unsub2();
    };
  }, [profile?.agencyId]);

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      await createAgency(user.uid, profile?.displayName || "User", name.trim());
      setName("");
    } catch (err) {
      setMessage(err.message || "Agency create nahi ho saki.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      await joinAgencyByCode(user.uid, code.trim());
      setCode("");
    } catch (err) {
      setMessage(err.message || "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!agency) return;
    setBusy(true);
    try {
      await leaveAgency(user.uid, agency.id);
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
        <h1 className="font-display text-base font-bold text-ink">Agency</h1>
      </div>

      {message && <p className="mx-4 mb-2 text-[11px] text-neon-pink">{message}</p>}

      {agency ? (
        <>
          <div className="mx-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10">
            <p className="text-sm font-bold text-ink">{agency.name}</p>
            <p className="mt-1 text-[11px] text-mist">Code: <span className="font-mono text-gold">{agency.code}</span></p>
            <p className="mt-1 text-[11px] text-mist">{agency.memberCount || 0} members</p>
            {agency.leaderId !== user.uid && (
              <button onClick={handleLeave} disabled={busy} className="mt-3 w-full rounded-xl bg-panel2 py-2 text-xs text-neon-pink disabled:opacity-50">
                Leave Agency
              </button>
            )}
          </div>

          <div className="mx-4 mt-4">
            <h2 className="mb-2 text-sm font-bold text-ink">Members (by diamonds)</h2>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-panel p-3 ring-1 ring-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-bold text-mist">#{i + 1}</span>
                    <span className="text-sm text-ink">{m.displayName}</span>
                  </div>
                  <span className="text-xs text-diamond">💎 {(m.diamonds || 0).toLocaleString()}</span>
                </div>
              ))}
              {members.length === 0 && <p className="text-xs text-mist">Koi members nahi hain abhi.</p>}
            </div>
          </div>
        </>
      ) : (
        <div className="mx-4 space-y-4">
          <div className="rounded-2xl bg-panel p-4 ring-1 ring-white/10">
            <p className="mb-2 text-sm font-bold text-ink">Create Agency</p>
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agency name" className="flex-1 rounded-lg bg-panel2 px-3 py-2 text-sm text-ink outline-none ring-1 ring-white/10" />
              <button onClick={handleCreate} disabled={busy} className="rounded-xl bg-glow-gradient px-4 py-2 text-xs font-bold text-ink disabled:opacity-50">Create</button>
            </div>
          </div>
          <div className="rounded-2xl bg-panel p-4 ring-1 ring-white/10">
            <p className="mb-2 text-sm font-bold text-ink">Join with Code</p>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" className="flex-1 rounded-lg bg-panel2 px-3 py-2 text-sm text-ink outline-none ring-1 ring-white/10" />
              <button onClick={handleJoin} disabled={busy} className="rounded-xl bg-glow-gradient px-4 py-2 text-xs font-bold text-ink disabled:opacity-50">Join</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
