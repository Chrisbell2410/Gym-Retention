import { createClient } from "@/lib/supabase/server";
import { DAILY_SEND_CAP } from "@/lib/outreach-config";
import { OutreachClient } from "@/components/outreach/outreach-client";
import type { DraftWithStudio } from "@/components/outreach/outreach-client";

export default async function OutreachPage() {
  const supabase = await createClient();

  const [
    { data: drafts, error: draftsError },
    { data: shoppedRows },
    { data: draftedRows },
    { data: studios },
  ] = await Promise.all([
    supabase
      .from("outreach_drafts")
      .select("*, studios(name, email)")
      .order("studio_id")
      .order("sequence_step"),
    supabase.from("secret_shop_logs").select("studio_id"),
    supabase.from("outreach_drafts").select("studio_id"),
    supabase
      .from("studios")
      .select("id, name")
      .eq("is_franchise", false)
      .order("name"),
  ]);

  const shoppedIds = new Set((shoppedRows ?? []).map((r) => r.studio_id));
  const draftedIds = new Set((draftedRows ?? []).map((r) => r.studio_id));
  const eligibleStudios = (studios ?? []).filter(
    (s) => shoppedIds.has(s.id) && !draftedIds.has(s.id),
  );

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await supabase
    .from("outreach_drafts")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", startOfToday.toISOString());

  if (draftsError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t load outreach drafts: {draftsError.message}
      </div>
    );
  }

  // Mirrors the fallback logic in lib/providers/email/index.ts — if either
  // is missing, every "send" actually goes through the mock provider.
  const isLiveSending = Boolean(
    process.env.RESEND_API_KEY && process.env.OUTREACH_FROM_EMAIL,
  );

  return (
    <OutreachClient
      drafts={(drafts ?? []) as DraftWithStudio[]}
      eligibleStudios={eligibleStudios}
      sentToday={sentToday ?? 0}
      dailyCap={DAILY_SEND_CAP}
      isLiveSending={isLiveSending}
    />
  );
}
