"use client";

import { useEffect, useRef, useState } from "react";
import { listenChat, sendChatMessage } from "@/lib/chat";

export default function LiveChat({ roomId, uid, name }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = listenChat(roomId, setMessages);
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const toSend = text;
    setText("");
    await sendChatMessage(roomId, { uid, name, text: toSend });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-mist">
            Say hi to start the chat 👋
          </p>
        )}
        {messages.map((m) => (
          <p key={m.id} className="text-sm leading-snug">
            <span className="font-semibold text-neon-violet">{m.name}: </span>
            <span className="text-ink/90">{m.text}</span>
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-white/5 p-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          maxLength={300}
          className="flex-1 rounded-full bg-panel2 px-4 py-2 text-sm text-ink outline-none ring-1 ring-white/10 focus:ring-neon-violet"
        />
        <button
          type="submit"
          className="rounded-full bg-glow-gradient px-4 py-2 text-sm font-semibold text-ink"
        >
          Send
        </button>
      </form>
    </div>
  );
}
