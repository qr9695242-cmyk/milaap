// Reports triage — lib/block.js already lets any user file a report;
// this is the moderator-side review queue mentioned as a follow-up in
// the Phase 4B README notes.
import { collection, doc, updateDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export function listenPendingReports(callback) {
  const q = query(
    collection(db, "reports"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** status: "resolved" | "dismissed" */
export async function resolveReport(reportId, status) {
  await updateDoc(doc(db, "reports", reportId), { status });
}
