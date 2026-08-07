// Frames (avatar rings) and Vehicles (entry rides) — cosmetic shop.
// Mirrors the pattern in lib/rewards.js: catalog lives here as plain data,
// purchase/equip run as Firestore transactions on the user's own doc, and
// UI (app/profile/frames, app/profile/vehicles) just renders + calls in.
//
// User doc fields used:
//   ownedFrames:   string[]   — frame ids the user has bought (or been given)
//   ownedVehicles: string[]   — vehicle ids the user has bought
//   equippedFrame:   string | null
//   equippedVehicle: string | null

import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

// rarity → border glow used by the shop grid + equipped badge
export const RARITY_STYLE = {
  common: { label: "Common", ring: "ring-mist/30", glow: "" },
  rare: { label: "Rare", ring: "ring-diamond/50", glow: "shadow-[0_0_18px_-4px_rgba(94,212,232,0.6)]" },
  epic: { label: "Epic", ring: "ring-neon-violet/60", glow: "shadow-[0_0_18px_-4px_rgba(139,92,246,0.6)]" },
  legendary: { label: "Legendary", ring: "ring-gold/70", glow: "shadow-[0_0_22px_-2px_rgba(245,195,77,0.7)]" },
};

// Every frame is a CSS gradient ring (no external art assets needed) plus
// an emoji glyph so it still reads fine on small screens / low-end phones.
export const FRAME_CATALOG = [
  { id: "frame_none", name: "No Frame", priceCoins: 0, rarity: "common", emoji: "", gradient: "transparent", free: true },
  { id: "frame_silver", name: "Silver Ring", priceCoins: 300, rarity: "common", emoji: "⚪", gradient: "linear-gradient(135deg,#C7CDD8,#8E97A8)" },
  { id: "frame_rose", name: "Rose Bloom", priceCoins: 800, rarity: "rare", emoji: "🌹", gradient: "linear-gradient(135deg,#FF3B7F,#FF8AB4)" },
  { id: "frame_ocean", name: "Ocean Wave", priceCoins: 800, rarity: "rare", emoji: "🌊", gradient: "linear-gradient(135deg,#5ED4E8,#2B7A9E)" },
  { id: "frame_phoenix", name: "Phoenix Wings", priceCoins: 2500, rarity: "epic", emoji: "🔥", gradient: "linear-gradient(135deg,#FF8A3D,#FF3B7F)" },
  { id: "frame_dragon", name: "Emerald Dragon", priceCoins: 2500, rarity: "epic", emoji: "🐉", gradient: "linear-gradient(135deg,#22C55E,#0EA5A5)" },
  { id: "frame_royal", name: "Royal Crown", priceCoins: 6000, rarity: "legendary", emoji: "👑", gradient: "linear-gradient(135deg,#F5C34D,#FF8A3D,#8B5CF6)" },
  { id: "frame_galaxy", name: "Galaxy Halo", priceCoins: 6000, rarity: "legendary", emoji: "🌌", gradient: "linear-gradient(135deg,#8B5CF6,#5ED4E8,#FF3B7F)" },
];

export const VEHICLE_CATALOG = [
  { id: "veh_none", name: "No Ride", priceCoins: 0, rarity: "common", emoji: "🚶", free: true },
  { id: "veh_bike", name: "City Bike", priceCoins: 400, rarity: "common", emoji: "🏍️" },
  { id: "veh_sedan", name: "Classic Sedan", priceCoins: 1200, rarity: "rare", emoji: "🚗" },
  { id: "veh_sports", name: "Sports Coupe", priceCoins: 3500, rarity: "epic", emoji: "🏎️" },
  { id: "veh_yacht", name: "Private Yacht", priceCoins: 5000, rarity: "epic", emoji: "🛥️" },
  { id: "veh_jet", name: "Private Jet", priceCoins: 9000, rarity: "legendary", emoji: "🛩️" },
  { id: "veh_supercar", name: "Golden Supercar", priceCoins: 12000, rarity: "legendary", emoji: "🏁" },
  { id: "veh_rocket", name: "Rocket Ship", priceCoins: 20000, rarity: "legendary", emoji: "🚀" },
];

function catalogFor(type) {
  return type === "frame" ? FRAME_CATALOG : VEHICLE_CATALOG;
}
function ownedField(type) {
  return type === "frame" ? "ownedFrames" : "ownedVehicles";
}
function equippedField(type) {
  return type === "frame" ? "equippedFrame" : "equippedVehicle";
}

export function findItem(type, itemId) {
  return catalogFor(type).find((i) => i.id === itemId) || null;
}

/** Buys an item with coins (transaction on the user's own doc). Call equipDecoration after to wear it. */
export async function purchaseDecoration(uid, type, itemId) {
  const item = findItem(type, itemId);
  if (!item) throw new Error("Item not found");

  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("Profile not found");
    const data = snap.data();
    const owned = data[ownedField(type)] || [];
    if (owned.includes(itemId)) return; // already owned — nothing to charge

    const coins = data.coins || 0;
    if (!item.free && coins < item.priceCoins) throw new Error("Not enough coins");

    tx.update(userRef, {
      [ownedField(type)]: [...owned, itemId],
      coins: item.free ? coins : coins - item.priceCoins,
    });
  });
}

/** Equips an already-owned (or free) item as the active frame/vehicle. */
export async function equipDecoration(uid, type, itemId) {
  const item = findItem(type, itemId);
  if (!item) throw new Error("Item not found");

  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("Profile not found");
    const data = snap.data();
    const owned = data[ownedField(type)] || [];
    if (!item.free && !owned.includes(itemId)) throw new Error("You don't own this item yet");

    tx.update(userRef, { [equippedField(type)]: item.free ? null : itemId });
  });
}
