"use client";

import { useState } from "react";
import { VOICE_CHANGER_PRESETS } from "@/lib/voiceChanger";

export default function VoiceChangerPicker({ current, onSelect }) {
  const [open, setOpen] = useState(false);
  const activePreset = VOICE_CHANGER_PRESETS.find((p) => p.id === current) || VOICE_CHANGER_PRESETS[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full bg-panel px-3 py-2 text-xs font-semibold text-ink ring-1 ring-white/10"
      >
        <span>{activePreset.emoji}</span>
        <span>Voice</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-2xl bg-panel p-5 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-sm font-bold text-ink">Voice Changer</h2>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {VOICE_CHANGER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ring-1 ${
                      p.id === current
                        ? "bg-gold/20 ring-gold/50"
                        : "bg-panel2 ring-white/10"
                    }`}
                  >
                    {p.emoji}
                  </span>
                  <span className="text-center text-[9px] text-mist">{p.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} className="mt-4 w-full py-2 text-center text-xs text-mist">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
