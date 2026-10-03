"use server";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Public, unauthenticated action — the person clicking an unsubscribe
 * link in a cold email isn't signed into Studio Spark, so this has to use
 * the admin client (bypasses RLS) rather than the normal session-scoped
 * one. The studio id in the link is only used to look up whose
 * suppression list to add the email to (there's one owner per studio);
 * nothing here trusts the request beyond that.
 */
export async function confirmUnsubscribe(
  email: string,
  studioId: string,
): Promise<{ error: string | null; success: boolean }> {
  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail || !studioId) {
    return { error: "This unsubscribe link is missing information.", success: false };
  }

  const admin = createAdminClient();

  const { data: studio } = await admin
    .from("studios")
    .select("owner_id")
    .eq("id", studioId)
    .single();

  if (!studio) {
    return {
      error: "Couldn't find the studio this link belongs to.",
      success: false,
    };
  }

  const { error } = await admin.from("suppression_list").insert({
    owner_id: studio.owner_id,
    email: trimmedEmail,
    reason: "unsubscribed",
  });

  // A unique-violation (23505) just means they already unsubscribed —
  // that's still a success from the visitor's point of view.
  if (error && error.code !== "23505") {
    return { error: error.message, success: false };
  }

  return { error: null, success: true };
}
