/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: "class", // toggled via lib/ThemeContext.js (adds/removes "light" on <html>)
  theme: {
    extend: {
      colors: {
        // These read from CSS variables (see app/globals.css) so the same
        // class names (bg-void, text-mist, etc.) repaint for light theme
        // without touching every page. "<alpha-value>" keeps /opacity
        // modifiers (bg-panel/60 etc.) working.
        void: "rgb(var(--color-void) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        panel2: "rgb(var(--color-panel2) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        // Professional palette: deep emerald/teal as the primary brand
        // color (CTA buttons, links, focus states) with a muted rose kept
        // only for destructive/alert actions. Replaces the old
        // pink-violet-orange neon trio, which read as a gamey/kids' app
        // next to reference apps (Yalla/Hapi-style: white cards, teal
        // CTAs, restrained gold for VIP).
        neon: {
          pink: "#E11D48",   // destructive / alerts only (sign out, errors)
          violet: "#0D9488", // secondary accent / focus rings (teal, not purple)
          orange: "#C97A2B", // muted amber, used sparingly
        },
        gold: "#D4A64A",     // premium/VIP/currency accent, less saturated than before
        diamond: "#1FA7B3",  // deep teal-cyan for the diamonds currency
        mist: "rgb(var(--color-mist) / <alpha-value>)", // muted text
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      backgroundImage: {
        // Primary CTA gradient: deep emerald → teal → gold. Same role as
        // before (main buttons, active nav, header banners) but reads as
        // premium instead of neon.
        "glow-gradient": "linear-gradient(135deg, #0B6B53 0%, #0D9488 55%, #D4A64A 100%)",
      },
      boxShadow: {
        glow: "0 0 32px -10px rgba(13, 148, 136, 0.45)",
        // Premium 3D system — raised/embossed surfaces + pressed state,
        // used app-wide for cards, buttons and badges (see globals.css).
        "3d": "0 1px 0 rgba(255,255,255,.07) inset, 0 -14px 24px -18px rgba(0,0,0,.5) inset, 0 14px 28px -16px rgba(0,0,0,.55), 0 4px 10px -6px rgba(0,0,0,.4)",
        "3d-light": "0 1px 0 rgba(255,255,255,.8) inset, 0 10px 24px -14px rgba(15,23,32,.18), 0 2px 6px -3px rgba(15,23,32,.12)",
        "3d-btn": "0 6px 14px -6px rgba(0,0,0,.5), 0 2px 4px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.45), inset 0 -3px 5px rgba(0,0,0,.28)",
        "3d-btn-active": "0 2px 6px -2px rgba(0,0,0,.5), inset 0 2px 4px rgba(0,0,0,.4)",
        "3d-badge": "0 1px 0 rgba(255,255,255,.55) inset, 0 -3px 6px rgba(0,0,0,.35) inset, 0 4px 10px -3px rgba(0,0,0,.5)",
      },
      keyframes: {
        "sheen-sweep": {
          "0%, 55%": { transform: "translateX(-130%) skewX(-12deg)" },
          "80%, 100%": { transform: "translateX(160%) skewX(-12deg)" },
        },
        "badge-pop": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        sheen: "sheen-sweep 3.4s ease-in-out infinite",
        "badge-pop": "badge-pop .35s cubic-bezier(.34,1.56,.64,1) both",
      },
    },
  },
  plugins: [],
};
