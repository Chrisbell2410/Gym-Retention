"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SECRET_SHOP_CHANNEL_LABELS } from "@/lib/labels";
import {
  computeChannelStats,
  computeOverallStats,
  formatDuration,
  isConfirmedNoReply,
  isPending,
  responseHours,
} from "@/lib/secret-shop-stats";
import { LogFormDialog } from "@/components/secret-shop/log-form-dialog";
import type { Database } from "@/types/supabase";

type SecretShopLog = Database["public"]["Tables"]["secret_shop_logs"]["Row"];

export interface LogWithStudio extends SecretShopLog {
  studios: { name: string } | null;
}

const selectClass =
  "rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-700 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none";

function StatusBadge({ log }: { log: SecretShopLog }) {
  if (log.first_reply_at) {
    const hours = responseHours(log);
    return (
      <Badge className="bg-harbor-100 text-harbor-700">
        Replied in {formatDuration(hours)}
      </Badge>
    );
  }
  if (isConfirmedNoReply(log)) {
    return <Badge className="bg-red-50 text-red-600">No reply</Badge>;
  }
  return <Badge className="bg-ink-100 text-ink-500">Awaiting reply</Badge>;
}

export function SecretShopClient({
  logs,
  studios,
}: {
  logs: LogWithStudio[];
  studios: { id: string; name: string }[];
}) {
  const [channelFilter, setChannelFilter] = useState("");
  const [studioFilter, setStudioFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editingLog, setEditingLog] = useState<SecretShopLog | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInstance, setFormInstance] = useState(0);

  const channelStats = useMemo(() => computeChannelStats(logs), [logs]);
  const overall = useMemo(() => computeOverallStats(logs), [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (channelFilter && l.channel !== channelFilter) return false;
      if (studioFilter && l.studio_id !== studioFilter) return false;
      if (statusFilter === "pending" && !isPending(l)) return false;
      if (statusFilter === "replied" && !l.first_reply_at) return false;
      if (statusFilter === "no_reply" && !isConfirmedNoReply(l)) return false;
      return true;
    });
  }, [logs, channelFilter, studioFilter, statusFilter]);

  function openAdd() {
    setEditingLog(null);
    setFormInstance((i) => i + 1);
    setFormOpen(true);
  }
  function openEdit(log: SecretShopLog) {
    setEditingLog(log);
    setFormInstance((i) => i + 1);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Secret Shop
          </h1>
          <p className="text-sm text-ink-400">
            {logs.length} inquir{logs.length === 1 ? "y" : "ies"} logged ·
            Charleston median {formatDuration(overall.medianHours)}
            {overall.noReplyPct !== null &&
              ` · ${overall.noReplyPct.toFixed(0)}% no reply`}
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={studios.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-spark-500 px-3 py-2 text-sm font-medium text-white hover:bg-spark-600 disabled:opacity-50"
        >
          <Plus size={15} />
          Log an inquiry
        </button>
      </div>

      {studios.length === 0 && (
        <p className="rounded-md bg-ink-50 p-3 text-sm text-ink-500">
          Add a studio on the Prospects screen first — there&apos;s nothing
          to secret-shop yet.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Response time by channel
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(SECRET_SHOP_CHANNEL_LABELS).map(([value, label]) => {
            const stat = channelStats.find((c) => c.channel === value);
            return (
              <div
                key={value}
                className="rounded-lg border border-surface-border bg-white p-4"
              >
                <div className="font-display text-xl font-bold text-ink-900">
                  {stat ? formatDuration(stat.medianHours) : "—"}
                </div>
                <div className="text-xs text-ink-400">{label}</div>
                {stat && stat.noReplyPct !== null && (
                  <div className="mt-1 text-xs text-ink-300">
                    {stat.noReplyPct.toFixed(0)}% no reply ({stat.resolved}{" "}
                    resolved)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-border bg-white p-3">
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All channels</option>
          {Object.entries(SECRET_SHOP_CHANNEL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={studioFilter}
          onChange={(e) => setStudioFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All studios</option>
          {studios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="pending">Awaiting reply</option>
          <option value="replied">Replied</option>
          <option value="no_reply">No reply</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs font-semibold tracking-wider text-ink-400 uppercase">
              <th className="px-4 py-3">Studio</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Quality</th>
              <th className="px-4 py-3">Offered booking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-300">
                  {logs.length === 0
                    ? "No secret-shop logs yet."
                    : "No entries match these filters."}
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => openEdit(log)}
                  className="cursor-pointer hover:bg-surface"
                >
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {log.studios?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {SECRET_SHOP_CHANNEL_LABELS[log.channel] ?? log.channel}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {new Date(log.sent_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge log={log} />
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {log.reply_quality ? `${log.reply_quality}/5` : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {log.offered_booking ? "Yes" : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LogFormDialog
        key={formInstance}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        log={editingLog}
        studios={studios}
      />
    </div>
  );
}
