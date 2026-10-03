"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { revenueLeakAssumptionsSchema } from "@/lib/validation/revenue-leak";

export type AssumptionsActionState = { error: string | null; success: boolean };

/** Saves a per-studio override of the revenue-leak assumptions. Selects
 * the existing row first rather than using Supabase's upsert/onConflict —
 * the unique index on (owner_id, studio_id) doesn't reliably dedupe
 * studio_id values the way a plain NOT NULL unique column would, so an
 * explicit select-then-insert-or-update is the safer path here. */
export async function saveRevenueLeakAssumptions(
  studioId: string,
  _prevState: AssumptionsActionState,
  formData: FormData,
): Promise<AssumptionsActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = revenueLeakAssumptionsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("revenue_leak_assumptions")
    .select("id")
    .eq("studio_id", studioId)
    .limit(1);

  const existingId = existing?.[0]?.id;

  const { error } = existingId
    ? await supabase
        .from("revenue_leak_assumptions")
        .update(parsed.data)
        .eq("id", existingId)
    : await supabase
        .from("revenue_leak_assumptions")
        .insert({ ...parsed.data, studio_id: studioId });

  if (error) return { error: error.message, success: false };

  revalidatePath(`/reports/${studioId}`);
  return { error: null, success: true };
}
