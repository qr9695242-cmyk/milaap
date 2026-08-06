import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";

const SEAT_COUNT = 12;

export function emptySeats() {
  return Array.from({ length: SEAT_COUNT }, (_, i) => ({
    seatIndex: i,
    uid: null,
    name: null,
    muted: false,
  }));
}

/** Create a new room. type: "live" (video broadcast) or "audio" (12-seat room) */
export async function createRoom({ type, title, hostUid, hostName }) {
  const ref = await addDoc(collection(db, "rooms"), {
    type,
    title,
    hostUid,
    hostName,
    status: "live",
    viewerCount: 0,
    seats: type === "audio" ? emptySeats() : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Subscribe to all currently-live rooms, newest first */
export function listenActiveRooms(callback) {
  const q = query(
    collection(db, "rooms"),
    where("status", "==", "live"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** Subscribe to a single room's live document */
export function listenRoom(roomId, callback) {
  return onSnapshot(doc(db, "rooms", roomId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function endRoom(roomId) {
  await updateDoc(doc(db, "rooms", roomId), { status: "ended" });
}

export async function deleteRoomIfEmpty(roomId) {
  await deleteDoc(doc(db, "rooms", roomId));
}

/** Claim an empty seat atomically — prevents two people grabbing the same seat */
export async function takeSeat(roomId, seatIndex, uid, name) {
  const ref = doc(db, "rooms", roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Room not found");
    const seats = snap.data().seats || emptySeats();
    if (seats[seatIndex].uid) throw new Error("Seat already taken");
    // Remove this user from any other seat they might be in first
    const next = seats.map((s) =>
      s.uid === uid ? { ...s, uid: null, name: null, muted: false } : s
    );
    next[seatIndex] = { seatIndex, uid, name, muted: false };
    tx.update(ref, { seats: next });
  });
}

export async function leaveSeat(roomId, seatIndex) {
  const ref = doc(db, "rooms", roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const seats = snap.data().seats || emptySeats();
    const next = [...seats];
    next[seatIndex] = { seatIndex, uid: null, name: null, muted: false };
    tx.update(ref, { seats: next });
  });
}

export async function toggleSeatMute(roomId, seatIndex, muted) {
  const ref = doc(db, "rooms", roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const seats = snap.data().seats || emptySeats();
    const next = [...seats];
    next[seatIndex] = { ...next[seatIndex], muted };
    tx.update(ref, { seats: next });
  });
}
