// Gift Level (aka "Wealth Level") — grows with lifetime coins a user has
// SPENT sending gifts (sender side). This is the counterpart to
// lib/hostLevel.js, which tracks lifetime diamonds a host has RECEIVED
// from gifts. The more you gift, the higher this level climbs.
//
// User doc field used: totalGiftedCoins (number) — incremented in
// lib/gifts.js's sendGift() every time someone sends a gift.
//
// 50 levels total. Level 1 unlocks at 5,000,000 gifted coins; each level
// after that needs ~13% more than the last, so climbing gets harder the
// higher you go (level 50 needs ~2 billion lifetime gifted coins).

const LEVEL_COUNT = 200;
const BASE_THRESHOLD = 5_000_000;
// Slower growth than the old 50-level curve so level 200 lands around
// ~2B lifetime gifted coins too — same top-end grind, just spread over
// more (and more frequent, more rewarding-feeling) level-ups.
const GROWTH = 1.032;

// Named tiers in bands of 5 levels — icon + color shown alongside "Lv.N".
// `gradient` is a 3-stop metallic sheet (dark edge → bright highlight →
// dark edge) used by GiftLevelBadge for the embossed 3D pill background;
// `sheenSpeed` makes the light-sweep animation noticeably faster at the
// top tiers so the badge itself communicates "more premium".
// Bands are now spread across 200 levels (proportionally ~4x the old
// 50-level bands) so the same 10 named tiers still exist, just each
// covers more ground.
const TIER_BANDS = [
  { through: 20, name: "Bronze Patron", icon: "🥉", color: "#C08552", gradient: "linear-gradient(135deg,#6e4420 0%,#c98a4b 45%,#8a5a2b 75%,#5a3a1a 100%)", sheenSpeed: "4.2s" },
  { through: 40, name: "Silver Patron", icon: "🥈", color: "#C7CDD8", gradient: "linear-gradient(135deg,#6b7480 0%,#e6ebf0 45%,#a3abb5 75%,#565d66 100%)", sheenSpeed: "3.9s" },
  { through: 60, name: "Gold Patron", icon: "🥇", color: "#D4A64A", gradient: "linear-gradient(135deg,#6b4e12 0%,#f0c766 45%,#c9973f 75%,#573c0d 100%)", sheenSpeed: "3.6s" },
  { through: 80, name: "Platinum Patron", icon: "💎", color: "#1FA7B3", gradient: "linear-gradient(135deg,#0a4850 0%,#7fe0ea 45%,#2fb6c2 75%,#073a41 100%)", sheenSpeed: "3.3s" },
  { through: 100, name: "Diamond Patron", icon: "💠", color: "#0E7490", gradient: "linear-gradient(135deg,#043c47 0%,#5fd7e8 45%,#0e93a8 75%,#032b33 100%)", sheenSpeed: "3.0s" },
  { through: 120, name: "Elite Patron", icon: "🔱", color: "#7C3AED", gradient: "linear-gradient(135deg,#2e1065 0%,#c4a6fb 45%,#7c3aed 75%,#210a4a 100%)", sheenSpeed: "2.8s" },
  { through: 140, name: "Royal Patron", icon: "👑", color: "#C97A2B", gradient: "linear-gradient(135deg,#4f2f0c 0%,#f2b25c 45%,#c97a2b 75%,#3a2208 100%)", sheenSpeed: "2.6s" },
  { through: 160, name: "Legend Patron", icon: "🔥", color: "#B5451B", gradient: "linear-gradient(135deg,#4a1509 0%,#ff8a5c 45%,#b5451b 75%,#331004 100%)", sheenSpeed: "2.4s" },
  { through: 180, name: "Mythic Patron", icon: "🌟", color: "#FF3B7F", gradient: "linear-gradient(135deg,#5c0930 0%,#ff8fb8 45%,#ff3b7f 75%,#450624 100%)", sheenSpeed: "2.1s" },
  { through: 200, name: "Immortal Patron", icon: "🏆", color: "#F5C34D", gradient: "linear-gradient(135deg,#7a5c0e 0%,#fff0bd 30%,#ffe08a 50%,#f5c34d 75%,#8a6a10 100%)", sheenSpeed: "1.8s" },
];

function tierFor(level) {
  return TIER_BANDS.find((b) => level <= b.through) || TIER_BANDS[TIER_BANDS.length - 1];
}

/** Levels 1..50, each with its coin threshold, name, icon and color. */
export const GIFT_LEVELS = Array.from({ length: LEVEL_COUNT }, (_, i) => {
  const level = i + 1;
  const minCoins = Math.round((BASE_THRESHOLD * Math.pow(GROWTH, i)) / 10000) * 10000;
  const tier = tierFor(level);
  return {
    level,
    minCoins,
    name: tier.name,
    icon: tier.icon,
    color: tier.color,
    gradient: tier.gradient,
    sheenSpeed: tier.sheenSpeed,
    isImmortal: tier.through === 50,
  };
});

const LEVEL_ZERO = {
  level: 0,
  minCoins: 0,
  name: "No Level",
  icon: "🌱",
  color: "#9AA3AC",
  gradient: "linear-gradient(135deg,#4b5259 0%,#a8b0b8 45%,#767f88 75%,#3a3f45 100%)",
  sheenSpeed: "5s",
  isImmortal: false,
};

export function giftLevelForSpend(totalGiftedCoins = 0) {
  let current = LEVEL_ZERO;
  for (const tier of GIFT_LEVELS) {
    if (totalGiftedCoins >= tier.minCoins) current = tier;
  }
  return current;
}

export function nextGiftLevel(totalGiftedCoins = 0) {
  return GIFT_LEVELS.find((t) => t.minCoins > totalGiftedCoins) || null;
}

/** 0–1 progress toward the next level, for a progress bar. */
export function giftLevelProgress(totalGiftedCoins = 0) {
  const current = giftLevelForSpend(totalGiftedCoins);
  const next = nextGiftLevel(totalGiftedCoins);
  if (!next) return 1;
  const span = next.minCoins - current.minCoins;
  const into = totalGiftedCoins - current.minCoins;
  return span > 0 ? Math.min(1, Math.max(0, into / span)) : 1;
}
