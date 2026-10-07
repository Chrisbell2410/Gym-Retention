"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface ChatLine {
  from: "lead" | "ai";
  text: string;
  tag?: "booked" | "escalated";
}

function loadVisitorId(studioConfigId: string): string {
  const key = `ss_chat_visitor_${studioConfigId}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

/** Standalone full-page version of the chat widget — same API route, same
 * agent, different presentation for a link instead of an embed (a studio
 * with no real website can still share this: Instagram bio, a QR code,
 * Google Business Profile). */
export function PublicChatClient({
  studioConfigId,
  studioName,
}: {
  studioConfigId: string;
  studioName: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([
    { from: "ai", text: `Hi! Ask me about classes, pricing, or book an intro spot at ${studioName}.` },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const visitorId = loadVisitorId(studioConfigId);
    setInput("");
    setLines((prev) => [...prev, { from: "lead", text }]);
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioConfigId,
          conversationId,
          visitorId,
          message: text,
        }),
      });
      const data = await res.json();
      setSending(false);

      if (data.conversationId) setConversationId(data.conversationId);

      if (data.error) {
        setError("Something went wrong. Please try again in a moment.");
        return;
      }
      if (data.handedOff && !data.reply) return;
      setLines((prev) => [
        ...prev,
        {
          from: "ai",
          text: data.reply,
          tag: data.booked ? "booked" : data.handedOff ? "escalated" : undefined,
        },
      ]);
    } catch {
      setSending(false);
      setError("Something went wrong. Please try again in a moment.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center gap-2.5 border-b border-surface-border bg-ink-900 px-4 py-3.5">
        <Logo variant="dark" size={22} />
        <span className="text-sm font-medium text-ink-200">Chat with {studioName}</span>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 py-4">
        <div className="flex-1 space-y-3 overflow-y-auto pb-3">
          {lines.map((line, i) => (
            <div key={i} className={`flex ${line.from === "lead" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2 text-sm font-medium ${
                  line.from === "lead" ? "bg-spark-500 text-white" : "bg-white text-ink-900 shadow-sm"
                }`}
              >
                {line.text}
                {line.tag && (
                  <div className="mt-1.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        line.tag === "booked" ? "bg-harbor-100 text-harbor-700" : "bg-spark-100 text-spark-700"
                      }`}
                    >
                      {line.tag === "booked" ? "Class booked" : "A team member will follow up"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && <p className="text-xs text-ink-300">Thinking…</p>}
          <div ref={bottomRef} />
        </div>

        {error && <p className="mb-2 rounded-md bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

        <div className="flex gap-2 border-t border-surface-border pt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message…"
            className="flex-1 rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 placeholder:font-normal placeholder:text-ink-300 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="rounded-md bg-spark-500 px-3.5 py-2.5 text-white hover:bg-spark-600 disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
