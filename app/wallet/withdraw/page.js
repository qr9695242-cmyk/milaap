"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  submitWithdrawRequest,
  diamondsToRs,
  listenMyWithdrawals,
} from "@/lib/wallet";
import { MIN_WITHDRAW_DIAMONDS } from "@/lib/config";

const STATUS_STYLES = {
  pending: "bg-gold/20 text-gold",
  paid: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-neon-pink/20 text-neon-pink",
};

const METHODS = [
  { id: "JazzCash", label: "JazzCash" },
  { id: "Easypaisa", label: "Easypaisa" },
];

export default function WithdrawPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [diamonds, setDiamonds] = useState("");
  const [method, setMethod] = useState("JazzCash");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenMyWithdrawals(user.uid, setHistory);
    return () => unsub();
  }, [user]);

  const available = profile?.diamonds ?? 0;
  const amount = Number(diamonds) || 0;
  const payoutRs = diamondsToRs(amount);
  const canSubmit =
    amount >= MIN_WITHDRAW_DIAMONDS && amount <= available && accountNumber.trim().length > 0;

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      await submitWithdrawRequest({
        uid: user.uid,
        name: profile?.displayName || "User",
        diamonds: amount,
        method,
        accountNumber,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-4 font-display text-lg font-extrabold text-ink">
          Withdraw Request Bhej Di Gayi
        </h1>
        <p className="mt-2 text-sm text-mist">
          {amount} diamonds (Rs {payoutRs}) ki request admin ko bhej di gayi hai.
          Approve hote hi payment {method} par bhej di jayegi.
        </p>
        <button
          onClick={() => router.push("/wallet")}
          className="mt-6 rounded-full bg-glow-gradient px-5 py-3 text-sm font-semibold text-ink"
        >
          Back to Wallet
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pb-16">
      {/* Header — back / title / Record (history) toggle, jaisa Wallet screen */}
      <header className="flex items-center justify-between px-5 pt-6">
        <Link href="/wallet" className="text-lg text-ink/80">←</Link>
        <h1 className="font-display text-base font-extrabold text-ink">Withdraw</h1>
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="text-xs font-semibold text-mist"
        >
          {showHistory ? "New" : "Record"} →
        </button>
      </header>

      {showHistory ? (
        <section className="mx-5 mt-5">
          {history.length === 0 ? (
            <p className="mt-6 text-center text-xs text-mist">Koi withdraw history nahi hai.</p>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-panel p-3 ring-1 ring-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">◆ {r.diamonds} diamonds</p>
                    <p className="text-xs text-mist">
                      Rs {r.payoutRs} · {r.method}
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
      ) : (
        <>
          {/* Balance card — same gradient hero style as Wallet's coin card */}
          <section className="mx-5 mt-4 rounded-2xl bg-glow-gradient p-5 shadow-glow">
            <p className="text-xs text-ink/80">Available to withdraw</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink">
              ◆ {available}
            </p>
            <p className="mt-1 text-[10px] text-ink/70">
              Minimum {MIN_WITHDRAW_DIAMONDS} diamonds
            </p>
          </section>

          <section className="mx-5 mt-5">
            <label className="text-xs font-semibold text-mist">
              Kitne diamonds withdraw karne hain?
            </label>
            <input
              type="number"
              value={diamonds}
              onChange={(e) => setDiamonds(e.target.value)}
              placeholder={`e.g. ${MIN_WITHDRAW_DIAMONDS}`}
              className="mt-2 w-full rounded-lg bg-panel px-4 py-3 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet"
            />
            {amount > 0 && (
              <p className="mt-2 text-xs text-gold">You'll receive: Rs {payoutRs}</p>
            )}
            {amount > available && (
              <p className="mt-1 text-xs text-neon-pink">
                Itni diamonds available nahi hain.
              </p>
            )}
            {amount > 0 && amount < MIN_WITHDRAW_DIAMONDS && (
              <p className="mt-1 text-xs text-neon-pink">
                Minimum {MIN_WITHDRAW_DIAMONDS} diamonds chahiye withdraw karne ke liye.
              </p>
            )}
          </section>

          {/* Payment method — pill list, jaisa image ke "Recharge Methods" row */}
          <section className="mx-5 mt-6">
            <p className="text-xs font-semibold text-mist">Payment method</p>
            <div className="mt-3 flex gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex-1 rounded-xl px-4 py-3 text-center text-xs font-semibold ${
                    method === m.id
                      ? "bg-white text-void ring-2 ring-neon-violet"
                      : "bg-panel text-ink ring-1 ring-white/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs text-mist">
                Aapka {method} account number
              </label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="03XXXXXXXXX"
                className="mt-1 w-full rounded-lg bg-panel px-4 py-3 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet"
              />
            </div>

            {error && <p className="mt-3 text-xs text-neon-pink">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || busy}
              className="mt-5 w-full rounded-full bg-glow-gradient py-3 text-sm font-semibold text-ink shadow-glow disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Request Withdraw"}
            </button>
            <p className="mt-2 text-center text-[11px] text-mist">
              Diamonds turant deduct ho jayengi. Admin approve karke aapko{" "}
              {method} par payment bhej dega.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
