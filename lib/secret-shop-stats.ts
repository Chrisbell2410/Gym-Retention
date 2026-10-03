/**
 * Pure functions for the Secret Shop screen's stats panel — response time
 * per channel, the Charleston median, and the no-reply rate. Computed
 * client-side from the fetched logs (fine at this data volume; revisit
 * with a SQL aggregate if the log ever gets into the thousands of rows).
 */

export interface LogForStats {
  channel: string;
  sent_at: string;
  first_reply_at: string | null;
}

/** A log with no reply after this many days is counted as a confirmed
 * no-reply rather than "still waiting" — keeps a studio secret-shopped
 * yesterday from skewing the no-reply rate before it's had a fair chance
 * to respond. */
export const NO_REPLY_THRESHOLD_DAYS = 7;

export function responseHours(log: LogForStats): number | null {
  if (!log.first_reply_at) return null;
  const ms =
    new Date(log.first_reply_at).getTime() - new Date(log.sent_at).getTime();
  return ms / (1000 * 60 * 60);
}

export function isConfirmedNoReply(
  log: LogForStats,
  now: Date = new Date(),
): boolean {
  if (log.first_reply_at) return false;
  const daysSince =
    (now.getTime() - new Date(log.sent_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= NO_REPLY_THRESHOLD_DAYS;
}

export function isPending(log: LogForStats, now: Date = new Date()): boolean {
  return !log.first_reply_at && !isConfirmedNoReply(log, now);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export interface ChannelStats {
  channel: string;
  total: number;
  pending: number;
  resolved: number;
  medianHours: number | null;
  /** Fastest single reply observed — used for "what the best studios do"
   * framing on the Response Time Report, not shown as a typical/expected
   * number. */
  fastestHours: number | null;
  noReplyCount: number;
  noReplyPct: number | null;
}

export function computeChannelStats(
  logs: LogForStats[],
  now: Date = new Date(),
): ChannelStats[] {
  const byChannel = new Map<string, LogForStats[]>();
  for (const log of logs) {
    const list = byChannel.get(log.channel) ?? [];
    list.push(log);
    byChannel.set(log.channel, list);
  }

  return Array.from(byChannel.entries()).map(([channel, channelLogs]) => {
    const pending = channelLogs.filter((l) => isPending(l, now)).length;
    const resolvedLogs = channelLogs.filter((l) => !isPending(l, now));
    const hours = resolvedLogs
      .map(responseHours)
      .filter((h): h is number => h !== null);
    const noReplyCount = resolvedLogs.filter((l) =>
      isConfirmedNoReply(l, now),
    ).length;

    return {
      channel,
      total: channelLogs.length,
      pending,
      resolved: resolvedLogs.length,
      medianHours: median(hours),
      fastestHours: hours.length > 0 ? Math.min(...hours) : null,
      noReplyCount,
      noReplyPct:
        resolvedLogs.length > 0
          ? (noReplyCount / resolvedLogs.length) * 100
          : null,
    };
  });
}

export function computeOverallStats(logs: LogForStats[], now: Date = new Date()) {
  const resolvedLogs = logs.filter((l) => !isPending(l, now));
  const hours = resolvedLogs
    .map(responseHours)
    .filter((h): h is number => h !== null);
  const noReplyCount = resolvedLogs.filter((l) =>
    isConfirmedNoReply(l, now),
  ).length;

  return {
    total: logs.length,
    pending: logs.filter((l) => isPending(l, now)).length,
    resolved: resolvedLogs.length,
    medianHours: median(hours),
    noReplyCount,
    noReplyPct:
      resolvedLogs.length > 0 ? (noReplyCount / resolvedLogs.length) * 100 : null,
  };
}

/** "45m", "6.3h", "2.1d" — picks the most readable unit for the size of
 * the number rather than always showing hours. */
export function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
