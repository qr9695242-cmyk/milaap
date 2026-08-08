"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { listenConversations, getUserProfile } from "@/lib/dm";
import BottomNav from "@/components/BottomNav";

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [convos, setConvos] = useState([]);
  const [peers, setPeers] = useState({}); // uid -> profile

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, setConvos);
    return () => unsub();
  }, [user]);

  // Resolve the "other member" profile for each conversation as they load.
  useEffect(() => {
    if (!user) return;
    convos.forEach((c) => {
      const otherUid = c.members?.find((m) => m !== user.uid);
      if (otherUid && !peers[otherUid]) {
        getUserProfile(otherUid).then((p) => {
          if (p) setPeers((prev) => ({ ...prev, [otherUid]: p }));
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convos, user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pb-28">
      <section className="bg-glow-gradient px-5 pb-6 pt-8">
        <h1 className="font-display text-lg font-extrabold text-ink">Messages</h1>
        <p className="text-xs text-ink/80">Private chats with your friends</p>
      </section>

      <section className="mx-5 mt-4">
        {convos.length === 0 ? (
          <p className="mt-10 text-center text-xs text-mist">
            Abhi koi conversation nahi hai. Kisi ka profile khol kar "Message" par tap karein.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {convos.map((c) => {
              const otherUid = c.members?.find((m) => m !== user.uid);
              const peer = peers[otherUid];
              const isVoice = c.lastMessage === "🎤 Voice message";
              return (
                <Link
                  key={c.id}
                  href={`/messages/${otherUid}`}
                  className="flex items-center gap-3 rounded-xl bg-panel px-4 py-3 ring-1 ring-white/5 active:opacity-80"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel2 text-sm font-bold text-ink">
                    {peer?.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={peer.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (peer?.displayName || "?")[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {peer?.displayName || "…"}
                    </p>
                    <p className="truncate text-xs text-mist">
                      {isVoice ? "🎤 Voice message" : c.lastMessage || "Say hi 👋"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
