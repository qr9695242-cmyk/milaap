"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  conversationId,
  listenMessages,
  sendTextMessage,
  sendVoiceMessage,
  getUserProfile,
} from "@/lib/dm";
import VoiceRecorder from "@/components/VoiceRecorder";

function VoiceBubble({ url, durationSec, mine }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 ${
        mine ? "bg-glow-gradient text-ink" : "bg-panel text-ink ring-1 ring-white/10"
      }`}
    >
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play voice message"}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-xs"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="h-1 w-24 rounded-full bg-white/30" />
      <span className="text-[10px] opacity-80">{durationSec}s</span>
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}

export default function DMThreadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const otherUid = params.uid;

  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!otherUid) return;
    getUserProfile(otherUid).then(setPeer);
  }, [otherUid]);

  useEffect(() => {
    if (!user || !otherUid) return;
    const convoId = conversationId(user.uid, otherUid);
    const unsub = listenMessages(convoId, setMessages);
    return () => unsub();
  }, [user, otherUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendText() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendTextMessage(user.uid, otherUid, user.uid, text);
      setText("");
    } finally {
      setSending(false);
    }
  }

  async function handleVoice(blob, durationSec) {
    setSending(true);
    try {
      await sendVoiceMessage(user.uid, otherUid, user.uid, blob, durationSec);
    } catch (e) {
      alert("Voice message bhejne mein masla hua: " + e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-mist text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-void">
      <header className="flex items-center gap-3 bg-glow-gradient px-5 pb-4 pt-6">
        <Link href="/messages" className="text-ink text-lg">‹</Link>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/20 text-sm font-bold text-ink">
          {peer?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={peer.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            (peer?.displayName || "?")[0]?.toUpperCase()
          )}
        </div>
        <p className="font-display text-base font-extrabold text-ink">
          {peer?.displayName || "…"}
        </p>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 pb-2">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-xs text-mist">
            Say hi to start the chat 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.uid === user.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              {m.type === "voice" ? (
                <VoiceBubble url={m.audioUrl} durationSec={m.durationSec} mine={mine} />
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-glow-gradient text-ink" : "bg-panel text-ink ring-1 ring-white/10"
                  }`}
                >
                  {m.text}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-white/5 bg-void px-4 py-3 pb-safe">
        <VoiceRecorder onRecorded={handleVoice} disabled={sending} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendText()}
          placeholder="Say something…"
          className="flex-1 rounded-full bg-panel px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet"
        />
        <button
          onClick={handleSendText}
          disabled={sending || !text.trim()}
          className="rounded-full bg-glow-gradient px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}
