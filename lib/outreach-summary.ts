/**
 * Turns a studio's secret-shop logs (and the Charleston-wide ones) into
 * the plain-language strings lib/ai/outreach-prompts.ts needs — kept
 * separate from the AI prompt file so the summarization logic is testable
 * on its own and reusable (e.g. by the Response Time Report later if it
 * ever wants matching copy).
 */
import { computeChannelStats, formatDuration } from "@/lib/secret-shop-stats";
import type { LogForStats } from "@/lib/secret-shop-stats";
import { SECRET_SHOP_CHANNEL_LABELS } from "@/lib/labels";

export function buildSecretShopSummary(studioLogs: LogForStats[]): string {
  const stats = computeChannelStats(studioLogs);
  const parts = stats.map((s) => {
    const label = SECRET_SHOP_CHANNEL_LABELS[s.channel] ?? s.channel;
    if (s.medianHours !== null) {
      return `${label}: replied in ${formatDuration(s.medianHours)}`;
    }
    if (s.resolved > 0) {
      return `${label}: never replied`;
    }
    return `${label}: still awaiting a reply`;
  });
  return parts.join("; ") || "No secret-shop data yet.";
}

export function buildCharlestonMedianSummary(allLogs: LogForStats[]): string {
  const stats = computeChannelStats(allLogs);
  const parts = stats
    .filter((s) => s.medianHours !== null)
    .map(
      (s) =>
        `${SECRET_SHOP_CHANNEL_LABELS[s.channel] ?? s.channel} ${formatDuration(s.medianHours)}`,
    );
  return parts.join(", ") || "not enough Charleston-wide data yet";
}
