"use client";

import { useState } from "react";
import { Send, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sendTestMessage, startTestConversation } from "@/lib/actions/agent-test";

interface ChatLine {
  from: "lead" | "ai";
  text: string;
  tag?: "booked" | "escalated";
}

export function AgentTestClient({
  studios,
}: {
  studios: { id: string; name: string }[];
}) {
  const [studioConfigId, setStudioConfigId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!studioConfigId) return;
    setError(null);
    setLines([]);
    const result = await startTestConversation(studioConfigId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConversationId(result.conversationId);
  }

  async function handleSend() {
    if (!conversationId || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setLines((prev) => [...prev, { from: "lead", text }]);
    setSending(true);
    setError(null);

    const result = await sendTestMessage(conversationId, text);
    setSending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.handedOff && !result.reply) {
      setLines((prev) => [
        ...prev,
        { from: "ai", text: "(conversation already handed off to a human — the AI won't reply further)" },
      ]);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        from: "ai",
        text: result.reply,
        tag: result.booked ? "booked" : result.handedOff ? "escalated" : undefined,
      },
    ]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          Agent Test Console
        </h1>
        <p className="text-sm text-ink-400">
          Try to break it. Mention an injury, ask for a refund, ask about a
          price that isn&apos;t configured — anything that should hand off
          to a human instead of the AI guessing. Nothing here is a real
          lead or a real booking channel.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-white p-3">
        <select
          value={studioConfigId}
          onChange={(e) => setStudioConfigId(e.target.value)}
          className="flex-1 rounded-md border border-ink-200 px-2.5 py-2 text-sm text-ink-700 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
        >
          <option value="">Choose a configured studio…</option>
          {studios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleStart}
          disabled={!studioConfigId}
          className="flex items-center gap-1.5 rounded-md bg-spark-500 px-3 py-2 text-sm font-medium text-white hover:bg-spark-600 disabled:opacity-50"
        >
          <RotateCcw size={14} />
          {conversationId ? "Restart" : "Start"}
        </button>
      </div>

      {studios.length === 0 && (
        <p className="rounded-md bg-ink-50 p-3 text-sm text-ink-500">
          No studios have an AI configuration yet — set one up first (open a
          studio on Prospects or Pipeline → &quot;AI Configuration&quot;).
        </p>
      )}

      {conversationId && (
        <div className="rounded-lg border border-surface-border bg-white">
          <div className="max-h-[28rem] space-y-3 overflow-y-auto p-4">
            {lines.length === 0 && (
              <p className="text-sm text-ink-300">
                Send a message as if you were a prospective lead.
              </p>
            )}
            {lines.map((line, i) => (
              <div
                key={i}
                className={`flex ${line.from === "lead" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm font-medium ${
                    line.from === "lead"
                      ? "bg-spark-500 text-white"
                      : "bg-surface text-ink-900"
                  }`}
                >
                  {line.text}
                  {line.tag && (
                    <div className="mt-1">
                      <Badge
                        className={
                          line.tag === "booked"
                            ? "bg-harbor-100 text-harbor-700"
                            : "bg-spark-100 text-spark-700"
                        }
                      >
                        {line.tag === "booked" ? "Class booked" : "Escalated to human"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && <p className="text-xs text-ink-300">Thinking…</p>}
          </div>
          <div className="flex gap-2 border-t border-surface-border p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message as the lead…"
              className="flex-1 rounded-md border border-ink-200 px-3 py-2 text-sm font-medium text-ink-900 placeholder:text-ink-300 placeholder:font-normal focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-md bg-spark-500 px-3 py-2 text-white hover:bg-spark-600 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
