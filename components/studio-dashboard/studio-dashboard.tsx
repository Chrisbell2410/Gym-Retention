"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/supabase";

type Message = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "direction" | "sender" | "body" | "created_at"
>;
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Conversation = Pick<
  Database["public"]["Tables"]["conversations"]["Row"],
  "id" | "contact_name" | "contact_identifier" | "status" | "created_at"
> & { messages: Message[] };

const STATUS_BADGE: Record<string, string> = {
  active: "bg-harbor-100 text-harbor-700",
  handed_off: "bg-spark-100 text-spark-700",
  closed: "bg-ink-100 text-ink-600",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  handed_off: "Escalated",
  closed: "Closed",
};
const BOOKING_BADGE: Record<string, string> = {
  booked: "bg-harbor-100 text-harbor-700",
  attended: "bg-harbor-100 text-harbor-700",
  no_show: "bg-ink-100 text-ink-600",
  cancelled: "bg-red-100 text-red-700",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StudioDashboard({
  studioName,
  conversations,
  bookings,
}: {
  studioName: string;
  conversations: Conversation[];
  bookings: Booking[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const escalated = conversations.filter((c) => c.status === "handed_off").length;
    const activeBookings = bookings.filter((b) => b.status === "booked" || b.status === "attended").length;
    return {
      totalConversations: conversations.length,
      escalated,
      totalBookings: activeBookings,
    };
  }, [conversations, bookings]);

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date().getTime();
    return {
      upcomingBookings: bookings.filter(
        (b) => new Date(b.class_datetime).getTime() >= now && b.status === "booked",
      ),
      pastBookings: bookings.filter(
        (b) => new Date(b.class_datetime).getTime() < now || b.status !== "booked",
      ),
    };
  }, [bookings]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">{studioName}</h1>
        <p className="text-sm text-ink-400">
          Conversations and bookings the AI agent has handled for this studio.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Conversations" value={stats.totalConversations} />
        <StatCard label="Classes booked" value={stats.totalBookings} accent="harbor" />
        <StatCard label="Escalated to a human" value={stats.escalated} accent="spark" />
      </div>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Bookings
        </h2>
        {bookings.length === 0 ? (
          <EmptyState text="No classes booked yet." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-surface-border bg-white">
            {upcomingBookings.length > 0 && (
              <BookingGroup title="Upcoming" rows={upcomingBookings} />
            )}
            {pastBookings.length > 0 && (
              <BookingGroup title="Past / other" rows={pastBookings} />
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Conversations
        </h2>
        {conversations.length === 0 ? (
          <EmptyState text="No conversations yet." />
        ) : (
          <div className="divide-y divide-surface-border overflow-hidden rounded-lg border border-surface-border bg-white">
            {conversations.map((c) => {
              const isOpen = expandedId === c.id;
              const lastMessage = c.messages[c.messages.length - 1];
              return (
                <div key={c.id}>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : c.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink-800">
                          {c.contact_name || "Anonymous visitor"}
                        </span>
                        <Badge className={STATUS_BADGE[c.status] ?? "bg-ink-100 text-ink-600"}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                      </div>
                      {lastMessage && (
                        <p className="mt-0.5 truncate text-xs text-ink-400">
                          {lastMessage.sender === "lead" ? "" : "AI: "}
                          {lastMessage.body}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-300">
                      {formatDateTime(c.created_at)}
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 bg-surface px-4 py-3">
                      {c.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.sender === "lead" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-1.5 text-xs ${
                              m.sender === "lead"
                                ? "bg-spark-500 text-white"
                                : "bg-white text-ink-800"
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "harbor" | "spark";
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-white p-4">
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent === "harbor" ? "text-harbor-600" : accent === "spark" ? "text-spark-600" : "text-ink-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-surface-border bg-white p-6 text-center text-sm text-ink-300">
      {text}
    </p>
  );
}

function BookingGroup({ title, rows }: { title: string; rows: Booking[] }) {
  return (
    <div>
      <div className="bg-surface px-4 py-1.5 text-xs font-semibold text-ink-400 uppercase">
        {title}
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-surface-border">
          {rows.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-2.5 font-medium text-ink-800">{b.lead_name}</td>
              <td className="px-4 py-2.5 text-ink-600">{b.class_name}</td>
              <td className="px-4 py-2.5 text-ink-500">{formatDateTime(b.class_datetime)}</td>
              <td className="px-4 py-2.5 text-right">
                <Badge className={BOOKING_BADGE[b.status] ?? "bg-ink-100 text-ink-600"}>
                  {b.status.replace("_", " ")}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
