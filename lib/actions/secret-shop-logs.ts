"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { secretShopLogInputSchema } from "@/lib/validation/secret-shop";
import type { Database } from "@/types/supabase";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LogActionState = { error: string | null; success: boolean };

type LogInsert = Database["public"]["Tables"]["secret_shop_logs"]["Insert"];

function computeRepliedWithin72h(
  sentAt: string,
  firstReplyAt: string | null,
): boolean | null {
  if (!firstReplyAt) return null;
  const hours =
    (new Date(firstReplyAt).getTime() - new Date(sentAt).getTime()) /
    (1000 * 60 * 60);
  return hours <= 72;
}

/** The first secret-shop log for a studio still sitting at "researched"
 * bumps it to "secret_shopped" automatically, and leaves a pipeline
 * activity record of why. Never downgrades or touches a studio already
 * further along (contacted, meeting booked, etc). */
async function maybeAdvancePipelineStage(
  supabase: SupabaseServerClient,
  studioId: string,
) {
  const { data: studio } = await supabase
    .from("studios")
    .select("pipeline_stage")
    .eq("id", studioId)
    .single();

  if (studio?.pipeline_stage !== "researched") return;

  await supabase
    .from("studios")
    .update({ pipeline_stage: "secret_shopped" })
    .eq("id", studioId);

  await supabase.from("pipeline_activities").insert({
    studio_id: studioId,
    type: "stage_change",
    previous_stage: "researched",
    new_stage: "secret_shopped",
    note: "Auto-advanced after logging a secret-shop inquiry",
  });
}

export async function createSecretShopLog(
  _prevState: LogActionState,
  formData: FormData,
): Promise<LogActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = secretShopLogInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("secret_shop_logs").insert({
    ...parsed.data,
    replied_within_72h: computeRepliedWithin72h(
      parsed.data.sent_at,
      parsed.data.first_reply_at,
    ),
  } satisfies LogInsert);

  if (error) return { error: error.message, success: false };

  await maybeAdvancePipelineStage(supabase, parsed.data.studio_id);

  revalidatePath("/secret-shop");
  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function updateSecretShopLog(
  id: string,
  _prevState: LogActionState,
  formData: FormData,
): Promise<LogActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = secretShopLogInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("secret_shop_logs")
    .update({
      ...parsed.data,
      replied_within_72h: computeRepliedWithin72h(
        parsed.data.sent_at,
        parsed.data.first_reply_at,
      ),
    })
    .eq("id", id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/secret-shop");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function deleteSecretShopLog(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("secret_shop_logs")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/secret-shop");
  return { error: null };
}
