// In-app notifications — Firestore based (push/FCM is a separate, later
// phase since it needs a VAPID key + service worker setup on your end).
// Each user has their own notifications/{uid}/items subcollection so
// reads are cheap and rules stay simple (owner-only).
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// type: "follow" | "gift" | "system" | "family" | "pk" | "withdraw"
export async function createNotification(toUid, { type, fromUid = null, fromName = null, fromAvatar = null, title, body = "", link = null }) {
  if (!toUid) return;
  await addDoc(collection(db, "notifications", toUid, "items"), {
    type,
    fromUid,
    fromName,
    fromAvatar,
    title,
    body,
    link,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/** Live subscription to the latest notifications for a user (newest first) */
export function listenNotifications(uid, callback, max = 50) {
  const q = query(
    collection(db, "notifications", uid, "items"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** Lightweight unread-count subscription for the bell badge */
export function listenUnreadCount(uid, callback) {
  const q = query(
    collection(db, "notifications", uid, "items"),
    orderBy("createdAt", "desc"),
    limit(50) // badge caps at "50+" — good enough, avoids reading the whole history
  );
  return onSnapshot(q, (snap) => {
    const unread = snap.docs.filter((d) => d.data().read === false).length;
    callback(unread);
  });
}

export async function markAsRead(uid, notifId) {
  await updateDoc(doc(db, "notifications", uid, "items", notifId), { read: true });
}

export async function markAllAsRead(uid, items) {
  // items = current loaded list (from listenNotifications) so we don't
  // need an extra read just to batch-update.
  const unread = items.filter((n) => !n.read);
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach((n) => {
    batch.update(doc(db, "notifications", uid, "items", n.id), { read: true });
  });
  await batch.commit();
}
