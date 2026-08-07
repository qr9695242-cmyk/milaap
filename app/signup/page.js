"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleGoogle() {
    setError("");
    setGoogleBusy(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, "users", result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          displayName: result.user.displayName || "User",
          email: result.user.email,
          avatar: "",
          coins: 0,
          diamonds: 0,
          vipLevel: 0,
          totalRechargedRs: 0,
          familyId: null,
          createdAt: serverTimestamp(),
        });
      }
      router.replace("/");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName: name,
        email,
        avatar: "",
        coins: 0,
        diamonds: 0,
        vipLevel: 0,
        totalRechargedRs: 0,
        familyId: null,
        createdAt: serverTimestamp(),
      });

      router.replace("/");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-void px-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-3xl font-extrabold">
          <span className="glow-text">Create Account</span>
        </h1>
        <p className="mt-2 text-sm text-mist">
          Join the room. Streaming, gifts, and rank await.
        </p>

        <button
          onClick={handleGoogle}
          disabled={googleBusy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-void disabled:opacity-60"
        >
          <GoogleIcon />
          {googleBusy ? "Signing in…" : "Continue with Google"}
        </button>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-mist">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSignup} className="mt-5 space-y-4">
          <div>
            <label className="text-xs text-mist">Display name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-panel px-4 py-3 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs text-mist">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-panel px-4 py-3 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-mist">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-panel px-4 py-3 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-xs text-neon-pink">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-glow-gradient py-3 text-sm font-semibold text-ink shadow-glow disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-mist">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function friendlyError(code) {
  const map = {
    "auth/email-already-in-use": "An account already exists with that email.",
    "auth/invalid-email": "That email doesn't look right.",
    "auth/weak-password": "Password is too weak.",
    "auth/popup-closed-by-user": "Google sign-in cancelled.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
