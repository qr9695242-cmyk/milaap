import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import { vipLevelForSpend } from "./vip";

export const RECHARGE_PACKAGES = [
  { id: "p1", coins: 100, priceRs: 150 },
  { id: "p2", coins: 550, priceRs: 750 },
  { id: "p3", coins: 1200, priceRs: 1500 },
  { id: "p4", coins: 3000, priceRs: 3500 },
  { id: "p5", coins: 6500, priceRs: 7500 },
  { id: "p6", coins: 14000, priceRs: 15000 },
];

/** Submit a recharge request — sits as "pending" until admin approves it (Phase 4 admin panel). */
export async function submitRechargeRequest({ uid, name, pkg, method, reference }) {
  await addDoc(collection(db, "rechargeRequests"), {
    uid,
    name,
    packageId: pkg.id,
    coins: pkg.coins,
    priceRs: pkg.priceRs,
    method,
    reference: reference || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export function listenMyRecharges(uid, callback) {
  const q = query(
    collection(db, "rechargeRequests"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenPendingRecharges(callback) {
  const q = query(
    collection(db, "rechargeRequests"),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** Admin-only (enforced by Firestore rules via ADMIN_EMAILS): credits coins + recomputes VIP tier. */
export async function approveRecharge(request) {
  const reqRef = doc(db, "rechargeRequests", request.id);
  const userRef = doc(db, "users", request.uid);
  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const data = userSnap.data();
    const newCoins = (data.coins || 0) + request.coins;
    const newTotalSpend = (data.totalRechargedRs || 0) + request.priceRs;
    tx.update(userRef, {
      coins: newCoins,
      totalRechargedRs: newTotalSpend,
      vipLevel: vipLevelForSpend(newTotalSpend).level,
    });
    tx.update(reqRef, { status: "approved" });
  });
}

export async function rejectRecharge(requestId) {
  await updateDoc(doc(db, "rechargeRequests", requestId), { status: "rejected" });
}
