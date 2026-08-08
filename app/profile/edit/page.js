"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import FramedAvatar from "@/components/FramedAvatar";
import BottomNav from "@/components/BottomNav";

const MAX_BIO_LEN = 150;
const MAX_ADDRESS_LEN = 120;
// Longest side a saved photo is allowed to be, in pixels. The photo is
// stored directly on the user doc as a data URL (no Firebase Storage
// bucket/rules to set up), so it's kept small on purpose — a Firestore
// document has a 1MB hard limit and a huge base64 string would eat most
// of it just for one field.
const PHOTO_MAX_DIMENSION = 480;
const PHOTO_JPEG_QUALITY = 0.82;

// Resizes+compresses the picked file in the browser (via <canvas>) before
// it's ever turned into base64, so a 12MB phone-camera photo doesn't blow
// past Firestore's per-document size limit.
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > PHOTO_MAX_DIMENSION) {
          height = Math.round((height * PHOTO_MAX_DIMENSION) / width);
          width = PHOTO_MAX_DIMENSION;
        } else if (height > PHOTO_MAX_DIMENSION) {
          width = Math.round((width * PHOTO_MAX_DIMENSION) / height);
          height = PHOTO_MAX_DIMENSION;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function EditProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null); // data URL staged for save
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Seed the form from the live profile once it loads (and whenever it
  // changes elsewhere) — but never stomp on a photo the person just picked
  // and hasn't saved yet.
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "");
    setBio(profile.bio || "");
    setGender(profile.gender || "");
    setDob(profile.dob || "");
    setAddress(profile.address || "");
  }, [profile]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setPhotoBusy(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setPhotoPreview(dataUrl);
    } catch (err) {
      setError(err.message || "Could not process that photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!displayName.trim()) {
      setError("Display name can't be empty.");
      return;
    }
    setBusy(true);
    try {
      const updates = {
        displayName: displayName.trim(),
        displayNameLower: displayName.trim().toLowerCase(), // keeps lib/search.js working
        bio: bio.trim(),
        gender,
        dob,
        address: address.trim(),
      };
      if (photoPreview) updates.avatar = photoPreview;
      await updateDoc(doc(db, "users", user.uid), updates);
      setSaved(true);
      setPhotoPreview(null);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Could not save your profile");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg bg-panel px-4 py-3 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet";

  return (
    <main className="min-h-screen bg-void pb-28">
      <section className="bg-glow-gradient px-5 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-ink text-lg">‹</Link>
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink">Edit Profile</h1>
            <p className="text-xs text-ink/80">Update your photo & personal info</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="mx-5 mt-5 space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-panel p-4 ring-1 ring-white/5">
          <FramedAvatar
            frameId={profile?.equippedFrame}
            name={displayName}
            photoURL={photoPreview || profile?.avatar}
            size={84}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoBusy}
            className="rounded-full bg-panel2 px-4 py-2 text-xs font-semibold text-ink ring-1 ring-white/10 disabled:opacity-60"
          >
            {photoBusy ? "Processing…" : "Change Photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoPick}
            className="hidden"
          />
        </div>

        <div>
          <label className="text-xs text-mist">Display name</label>
          <input
            type="text"
            required
            maxLength={40}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-mist">Bio</label>
            <span className="text-[10px] text-mist">{bio.length}/{MAX_BIO_LEN}</span>
          </div>
          <textarea
            value={bio}
            maxLength={MAX_BIO_LEN}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Tell people a little about yourself"
          />
        </div>

        <div>
          <label className="text-xs text-mist">Gender</label>
          <div className="mt-1 flex gap-2">
            {[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ring-1 ${
                  gender === opt.value
                    ? "bg-glow-gradient text-ink ring-transparent"
                    : "bg-panel text-mist ring-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-mist">Date of birth</label>
          <input
            type="date"
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDob(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-mist">Address</label>
            <span className="text-[10px] text-mist">{address.length}/{MAX_ADDRESS_LEN}</span>
          </div>
          <input
            type="text"
            value={address}
            maxLength={MAX_ADDRESS_LEN}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder="City, country"
          />
        </div>

        {error && <p className="text-xs text-neon-pink">{error}</p>}
        {saved && <p className="text-xs text-diamond">Profile updated!</p>}

        <button
          type="submit"
          disabled={busy || photoBusy}
          className="w-full rounded-full bg-glow-gradient py-3 text-sm font-semibold text-ink shadow-glow disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <BottomNav />
    </main>
  );
}
