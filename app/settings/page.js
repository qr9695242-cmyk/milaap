"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import FramedAvatar from "@/components/FramedAvatar";
import BottomNav from "@/components/BottomNav";

// Simple iOS-style toggle switch, styled to match the app's glow theme.
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-glow-gradient" : "bg-panel2 ring-1 ring-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Row({ label, hint, right }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="pr-3">
        <p className="text-sm text-ink/90">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-mist">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="mx-5 mt-5">
      {title && <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-mist">{title}</p>}
      <div className="divide-y divide-white/5 rounded-xl bg-panel ring-1 ring-white/5">{children}</div>
    </section>
  );
}

const DEFAULT_NOTIF_PREFS = {
  likes: true,
  comments: true,
  followers: true,
  gifts: true,
  liveFromFollowing: true,
};

export default function SettingsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [privateAccount, setPrivateAccount] = useState(false);
  const [hideDob, setHideDob] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF_PREFS);
  const [savingKey, setSavingKey] = useState(""); // which field is mid-save, for subtle disabling
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile) return;
    setPrivateAccount(!!profile.privateAccount);
    setHideDob(!!profile.hideDob);
    setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...(profile.notifPrefs || {}) });
  }, [profile]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  async function saveField(key, value) {
    setError("");
    setSavingKey(key);
    try {
      await updateDoc(doc(db, "users", user.uid), { [key]: value });
    } catch (err) {
      setError(err.message || "Could not save that setting.");
    } finally {
      setSavingKey("");
    }
  }

  function togglePrivate(next) {
    setPrivateAccount(next);
    saveField("privateAccount", next);
  }

  function toggleHideDob(next) {
    setHideDob(next);
    saveField("hideDob", next);
  }

  function toggleNotif(key, next) {
    const merged = { ...notifPrefs, [key]: next };
    setNotifPrefs(merged);
    saveField("notifPrefs", merged);
  }

  async function handlePasswordReset() {
    if (!user.email) return;
    setError("");
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (err) {
      setError(err.message || "Could not send reset email.");
    }
  }

  return (
    <main className="min-h-screen bg-void pb-28">
      <section className="bg-glow-gradient px-5 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-ink text-lg">‹</Link>
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink">Settings</h1>
            <p className="text-xs text-ink/80">Account, privacy & app preferences</p>
          </div>
        </div>
      </section>

      <section className="mx-5 -mt-3 flex items-center gap-3 rounded-xl bg-panel p-4 ring-1 ring-white/5">
        <FramedAvatar frameId={profile?.equippedFrame} name={profile?.displayName} photoURL={profile?.avatar} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{profile?.displayName || "User"}</p>
          <p className="truncate text-xs text-mist">{user.email}</p>
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 rounded-full bg-panel2 px-3 py-1.5 text-[11px] font-semibold text-ink ring-1 ring-white/10"
        >
          Edit Profile
        </Link>
      </section>

      {error && <p className="mx-5 mt-3 text-xs text-neon-pink">{error}</p>}

      <SectionCard title="Privacy & Safety">
        <Row
          label="Private account"
          hint="Only approved followers can see your posts & live status"
          right={<Toggle checked={privateAccount} onChange={togglePrivate} disabled={savingKey === "privateAccount"} />}
        />
        <Row
          label="Hide date of birth"
          hint="Keep your birthday hidden from your public profile"
          right={<Toggle checked={hideDob} onChange={toggleHideDob} disabled={savingKey === "hideDob"} />}
        />
        <Link href="/blocked" className="flex items-center justify-between px-4 py-3 text-sm text-ink/90">
          Blocked Users
          <span className="text-mist">›</span>
        </Link>
      </SectionCard>

      <SectionCard title="Notifications">
        <Row
          label="Likes"
          right={<Toggle checked={notifPrefs.likes} onChange={(v) => toggleNotif("likes", v)} disabled={savingKey === "notifPrefs"} />}
        />
        <Row
          label="Comments & messages"
          right={<Toggle checked={notifPrefs.comments} onChange={(v) => toggleNotif("comments", v)} disabled={savingKey === "notifPrefs"} />}
        />
        <Row
          label="New followers"
          right={<Toggle checked={notifPrefs.followers} onChange={(v) => toggleNotif("followers", v)} disabled={savingKey === "notifPrefs"} />}
        />
        <Row
          label="Gifts"
          right={<Toggle checked={notifPrefs.gifts} onChange={(v) => toggleNotif("gifts", v)} disabled={savingKey === "notifPrefs"} />}
        />
        <Row
          label="When people you follow go live"
          right={
            <Toggle
              checked={notifPrefs.liveFromFollowing}
              onChange={(v) => toggleNotif("liveFromFollowing", v)}
              disabled={savingKey === "notifPrefs"}
            />
          }
        />
      </SectionCard>

      <SectionCard title="Preferences">
        <Row
          label="Dark mode"
          hint={theme === "dark" ? "Currently on" : "Currently off"}
          right={<Toggle checked={theme === "dark"} onChange={toggleTheme} />}
        />
        <Row label="Language" right={<span className="text-xs text-mist">English</span>} />
      </SectionCard>

      <SectionCard title="Account">
        {user.email && (
          <button
            onClick={handlePasswordReset}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-ink/90"
          >
            Change Password
            <span className="text-mist">{resetSent ? "Email sent ✓" : "›"}</span>
          </button>
        )}
        <Link href="/help" className="flex items-center justify-between px-4 py-3 text-sm text-ink/90">
          Help & Support
          <span className="text-mist">›</span>
        </Link>
      </SectionCard>

      <div className="mx-5 mt-5 space-y-3">
        <button
          onClick={() => signOut(auth)}
          className="w-full rounded-full bg-panel py-3 text-sm font-semibold text-neon-pink ring-1 ring-neon-pink/30"
        >
          Sign Out
        </button>
        <Link
          href="/help"
          className="block w-full rounded-full bg-panel py-3 text-center text-xs font-semibold text-mist ring-1 ring-white/10"
        >
          Request Account Deletion
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
