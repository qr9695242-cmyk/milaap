import {
  collection,
  addDoc,
  query,
  orderBy,
  limitToLast,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export function listenChat(roomId, callback, max = 100) {
  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "asc"),
    limitToLast(max)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendChatMessage(roomId, { uid, name, text }) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(collection(db, "rooms", roomId, "messages"), {
    uid,
    name,
    text: trimmed.slice(0, 300),
    createdAt: serverTimestamp(),
  });
}
