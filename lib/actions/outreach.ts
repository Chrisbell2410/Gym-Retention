"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/providers/email";
import {
  draftColdEmail,
  draftFollowUpSequence,
} from "@/lib/ai/outreach-prompts";
import {
  buildCharlestonMedianSummary,
  buildSecretShopSummary,
} from "@/lib/outreach-summary";
import {
  buildCanSpamFooterText,
  buildUnsubscribeUrl,
  getBusinessMailingAddress,
  isAppUrlConfiguredForSending,
} from "@/lib/outreach-footer";
import { DAILY_SEND_CAP } from "@/lib/outreach-config";
import { NEIGHBORHOOD_LABELS, CATEGORY_LABELS } from "@/lib/labels";
import type { Database } from "@/types/supabase";

type OutreachDraftInsert =
  Database["public"]["Tables"]["outreach_drafts"]["Insert"];

// ---------------------------------------------------------------------------
// Generate (AI)
// ---------------------------------------------------------------------------

export async function generateDraftsForStudio(
  studioId: string,
): Promise<{ error: string | null; created: number }> {
  const supabase = await createClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name, category, neighborhood")
    .eq("id", studioId)
    .single();
  if (!studio) return { error: "Studio not found", created: 0 };

  const { count: existingCount } = await supabase
    .from("outreach_drafts")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId);
  if (existingCount && existingCount > 0) {
    return {
      error: "Drafts already exist for this studio — edit those instead of generating new ones.",
      created: 0,
    };
  }

  const [{ data: studioLogs }, { data: allLogs }] = await Promise.all([
    supabase
      .from("secret_shop_logs")
      .select("channel, sent_at, first_reply_at")
      .eq("studio_id", studioId),
    supabase.from("secret_shop_logs").select("channel, sent_at, first_reply_at"),
  ]);

  if (!studioLogs || studioLogs.length === 0) {
    return {
      error: "Secret-shop this studio first — there's nothing to reference yet.",
      created: 0,
    };
  }

  const input = {
    studioName: studio.name,
    neighborhood: studio.neighborhood
      ? (NEIGHBORHOOD_LABELS[studio.neighborhood] ?? studio.neighborhood)
      : "Charleston",
    category: studio.category
      ? (CATEGORY_LABELS[studio.category] ?? studio.category)
      : "studio",
    secretShopSummary: buildSecretShopSummary(studioLogs),
    charlestonMedianResponseTime: buildCharlestonMedianSummary(allLogs ?? []),
  };

  let initial, sequence;
  try {
    initial = await draftColdEmail(input);
    sequence = await draftFollowUpSequence(input, initial);
  } catch (e) {
    return {
      error: `Couldn't generate drafts: ${e instanceof Error ? e.message : "AI request failed"}. Make sure ANTHROPIC_API_KEY is set in .env.local.`,
      created: 0,
    };
  }

  const rows: OutreachDraftInsert[] = [
    { studio_id: studioId, sequence_step: 0, subject: initial.subject, body: initial.body },
    { studio_id: studioId, sequence_step: 3, subject: sequence.day3.subject, body: sequence.day3.body },
    { studio_id: studioId, sequence_step: 7, subject: sequence.day7.subject, body: sequence.day7.body },
    { studio_id: studioId, sequence_step: 14, subject: sequence.day14.subject, body: sequence.day14.body },
  ];

  const { error } = await supabase.from("outreach_drafts").insert(rows);
  if (error) return { error: error.message, created: 0 };

  revalidatePath("/outreach");
  return { error: null, created: rows.length };
}

// ---------------------------------------------------------------------------
// Edit / approve / skip
// ---------------------------------------------------------------------------

export type DraftActionState = { error: string | null; success: boolean };

export async function updateOutreachDraft(
  id: string,
  _prevState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) {
    return { error: "Subject and body can't be empty", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach_drafts")
    .update({ subject, body })
    .eq("id", id)
    .eq("status", "draft"); // editing an approved/sent draft happens via unapprove first

  if (error) return { error: error.message, success: false };
  revalidatePath("/outreach");
  return { error: null, success: true };
}

export async function approveOutreachDraft(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach_drafts")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");
  if (error) return { error: error.message };
  revalidatePath("/outreach");
  return { error: null };
}

/** Moves an approved-but-unsent, or a skipped, draft back to "draft" so it
 * can be edited/reconsidered. Never touches a draft that's already sent —
 * that's permanent. */
export async function restoreOutreachDraftToDraft(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach_drafts")
    .update({ status: "draft", approved_at: null })
    .eq("id", id)
    .in("status", ["approved", "skipped"]);
  if (error) return { error: error.message };
  revalidatePath("/outreach");
  return { error: null };
}

export async function skipOutreachDraft(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach_drafts")
    .update({ status: "skipped" })
    .eq("id", id)
    .in("status", ["draft", "approved"]);
  if (error) return { error: error.message };
  revalidatePath("/outreach");
  return { error: null };
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

export async function sendOutreachDraft(
  id: string,
): Promise<{ error: string | null }> {
  const address = getBusinessMailingAddress();
  if (!address) {
    return {
      error:
        "Set BUSINESS_MAILING_ADDRESS in .env.local before sending — CAN-SPAM requires a physical mailing address in every outreach email.",
    };
  }
  if (!isAppUrlConfiguredForSending()) {
    return {
      error:
        "Set APP_URL in .env.local to your real deployed URL before sending — the unsubscribe link in the email would otherwise point at localhost and be broken for whoever receives it.",
    };
  }

  const supabase = await createClient();

  const { data: draft } = await supabase
    .from("outreach_drafts")
    .select("*, studios(id, name, email)")
    .eq("id", id)
    .single();

  if (!draft) return { error: "Draft not found" };
  if (draft.status !== "approved") {
    return { error: "Only approved drafts can be sent" };
  }

  const studio = draft.studios;
  if (!studio) return { error: "That draft's studio no longer exists" };
  if (!studio.email) {
    return { error: `No email on file for ${studio.name} — add one on the Prospects screen first.` };
  }

  const { data: suppressed } = await supabase
    .from("suppression_list")
    .select("id")
    .eq("email", studio.email.toLowerCase())
    .limit(1);
  if (suppressed && suppressed.length > 0) {
    await supabase
      .from("outreach_drafts")
      .update({ status: "skipped" })
      .eq("id", id);
    revalidatePath("/outreach");
    return { error: `${studio.email} is on the suppression list — this draft was marked skipped instead of sent.` };
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await supabase
    .from("outreach_drafts")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", startOfToday.toISOString());
  if ((sentToday ?? 0) >= DAILY_SEND_CAP) {
    return {
      error: `Daily send cap (${DAILY_SEND_CAP}) reached — try again tomorrow.`,
    };
  }

  const unsubscribeUrl = buildUnsubscribeUrl(studio.id, studio.email);
  const footer = buildCanSpamFooterText(unsubscribeUrl, address);

  try {
    const result = await getEmailProvider().send({
      to: studio.email,
      subject: draft.subject,
      text: `${draft.body}\n${footer}`,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    });

    const { error } = await supabase
      .from("outreach_drafts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: result.providerMessageId,
      })
      .eq("id", id);
    if (error) return { error: error.message };
  } catch (e) {
    return {
      error: `Send failed: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }

  revalidatePath("/outreach");
  return { error: null };
}
