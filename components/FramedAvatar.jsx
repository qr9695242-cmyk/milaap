"use client";

import { findItem } from "@/lib/decorations";

// Frame PNGs are square with a transparent hole centered in the middle
// (see public/frames/) that covers ~60% of the image width — so the ring
// art needs to render at ~1.667x the avatar's diameter for the photo to
// exactly fill the hole. That's FRAME_SCALE below.
const FRAME_SCALE = 1.667;

/**
 * Circle avatar (photo or initial) with the equipped frame image overlaid
 * as a ring around it.
 *
 * IMPORTANT: because the frame ring is bigger than the avatar photo itself,
 * this component's outer box is sized to the *frame's* footprint (size *
 * FRAME_SCALE) whenever a frame is equipped, not just `size` — otherwise the
 * ring visually spills out over whatever sits next to it (name text next to
 * the profile avatar, neighbouring seats in the live seat grid, etc). When
 * no frame is equipped the box is exactly `size`, same as before.
 */
export default function FramedAvatar({ frameId, name, photoURL, size = 56, ring = true }) {
  const frame = frameId ? findItem("frame", frameId) : null;
  const initial = (name || "?").charAt(0).toUpperCase();
  const box = frame?.image ? Math.round(size * FRAME_SCALE) : size;

  return (
    <div className="relative shrink-0" style={{ width: box, height: box }}>
      <div
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-panel2 text-ink ${
          ring ? "ring-1 ring-white/10" : ""
        }`}
        style={{ width: size, height: size }}
      >
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoURL} alt={name || "avatar"} className="h-full w-full object-cover" />
        ) : (
          <span className="font-bold" style={{ fontSize: size * 0.4 }}>
            {initial}
          </span>
        )}
      </div>
      {frame?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame.image}
          alt=""
          className="pointer-events-none absolute inset-0 select-none object-contain"
          draggable={false}
        />
      )}
    </div>
  );
}
