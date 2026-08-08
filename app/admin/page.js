"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ADMIN_EMAILS } from "@/lib/config";
import { effectiveRole, hasAtLeastRole, ROLES } from "@/lib/roles";
import {
  listenPendingRecharges,
  approveRecharge,
  rejectRecharge,
  listenPendingWithdrawals,
  approveWithdraw,
  rejectWithdraw,
} from "@/lib/wallet";
import { listenPendingReports, resolveReport } from "@/lib/moderation";
import { getAnalyticsSnapshot } from "@/lib/analytics";

const TABS = ["Overview", "Recharges", "Withdrawals", "Reports"];

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [recharges, setRecharges] = useState([]);
  const [rechargeErr, setRechargeErr] = useState("");
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawErr, setWithdrawErr] = useState("");
  const [reports, setReports] = useState([]);
  const [reportErr, setReportErr] = useState("");
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(null);

  const role = effectiveRole(user, profile);
  const isAdmin = hasAtLeastRole(role, ROLES.ADMIN);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const u1 = listenPendingRecharges(setRecharges, (e) => setRechargeErr(e?.message || "Load failed"));
    const u2 = listenPendingWithdrawals(setWithdrawals, (e) => setWithdrawErr(e?.message || "Load failed"));
    const u3 = listenPendingReports(setReports, (e) => setReportErr(e?.message || "Load failed"));
    getAnalyticsSnapshot().then(setStats).catch(() => {});
    return () => {
      u1();
      u2();
      u3();
    };
  }, [isAdmin]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-void text-mist text-sm">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-void text-center">
        <p className="text-sm text-ink">Aap ke paas admin access nahi hai.</p>
        <button onClick={() => router.push("/")} className="rounded-full bg-panel px-4 py-2 text-xs text-ink ring-1 ring-white/10">Home</button>
      </div>
    );
  }

  async function act(id, fn) {
    setBusy(id);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-void pb-10">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-ink ring-1 ring-white/10">←</button>
        <h1 className="font-display text-base font-bold text-ink">Admin Panel</h1>
      </div>

      <div className="mx-4 flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${tab === t ? "bg-glow-gradient text-ink" : "bg-panel text-mist ring-1 ring-white/10"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
          {stats ? (
            Object.entries(stats).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-panel p-4 ring-1 ring-white/10">
                <p className="text-[10px] capitalize text-mist">{k.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-1 text-lg font-bold text-ink">{typeof v === "number" ? v.toLocaleString() : String(v)}</p>
              </div>
            ))
          ) : (
            <p className="col-span-2 text-xs text-mist">Loading stats…</p>
          )}
        </div>
      )}

      {tab === "Recharges" && (
        <div className="mx-4 mt-3 space-y-2">
          {rechargeErr && <p className="text-[11px] text-neon-pink">{rechargeErr}</p>}
          {recharges.length === 0 && <p className="text-xs text-mist">Koi pending recharge nahi.</p>}
          {recharges.map((r) => (
            <div key={r.id} className="rounded-xl bg-panel p-3 ring-1 ring-white/5">
              <p className="text-sm text-ink">{r.name} — {r.coins?.toLocaleString()} coins (Rs {r.priceRs})</p>
              <p className="text-[10px] text-mist">{r.method} · ref: {r.reference || "—"}</p>
              <div className="mt-2 flex gap-2">
                <button disabled={busy === r.id} onClick={() => act(r.id, () => approveRecharge(r))} className="flex-1 rounded-lg bg-emerald-500 py-1.5 text-xs font-bold text-white disabled:opacity-50">Approve</button>
                <button disabled={busy === r.id} onClick={() => act(r.id, () => rejectRecharge(r.id))} className="flex-1 rounded-lg bg-white/10 py-1.5 text-xs font-bold text-ink disabled:opacity-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Withdrawals" && (
        <div className="mx-4 mt-3 space-y-2">
          {withdrawErr && <p className="text-[11px] text-neon-pink">{withdrawErr}</p>}
          {withdrawals.length === 0 && <p className="text-xs text-mist">Koi pending withdrawal nahi.</p>}
          {withdrawals.map((w) => (
            <div key={w.id} className="rounded-xl bg-panel p-3 ring-1 ring-white/5">
              <p className="text-sm text-ink">{w.name} — 💎 {w.diamonds?.toLocaleString()} (Rs {w.payoutRs})</p>
              <p className="text-[10px] text-mist">{w.method} · {w.accountNumber}</p>
              <div className="mt-2 flex gap-2">
                <button disabled={busy === w.id} onClick={() => act(w.id, () => approveWithdraw(w.id))} className="flex-1 rounded-lg bg-emerald-500 py-1.5 text-xs font-bold text-white disabled:opacity-50">Mark Paid</button>
                <button disabled={busy === w.id} onClick={() => act(w.id, () => rejectWithdraw(w))} className="flex-1 rounded-lg bg-white/10 py-1.5 text-xs font-bold text-ink disabled:opacity-50">Reject & Refund</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Reports" && (
        <div className="mx-4 mt-3 space-y-2">
          {reportErr && <p className="text-[11px] text-neon-pink">{reportErr}</p>}
          {reports.length === 0 && <p className="text-xs text-mist">Koi pending report nahi.</p>}
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl bg-panel p-3 ring-1 ring-white/5">
              <p className="text-sm text-ink">{r.targetName} — {r.reason}</p>
              {r.details && <p className="mt-1 text-[11px] text-mist">{r.details}</p>}
              <p className="text-[10px] text-mist">Reported by {r.reporterName}</p>
              <div className="mt-2 flex gap-2">
                <button disabled={busy === r.id} onClick={() => act(r.id, () => resolveReport(r.id, "resolved"))} className="flex-1 rounded-lg bg-emerald-500 py-1.5 text-xs font-bold text-white disabled:opacity-50">Resolve</button>
                <button disabled={busy === r.id} onClick={() => act(r.id, () => resolveReport(r.id, "dismissed"))} className="flex-1 rounded-lg bg-white/10 py-1.5 text-xs font-bold text-ink disabled:opacity-50">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
