"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { studioConfigInputSchema } from "@/lib/validation/studio-config";

export type StudioConfigActionState = { error: string | null; success: boolean };

/** Upserts by studio_id — select-then-insert-or-update rather than
 * Supabase's upsert/onConflict, same reasoning as
 * lib/actions/revenue-leak.ts (keeps this independent of whatever
 * uniqueness quirks a nullable or compound key might have, and this one
 * isn't nullable, but consistency with the established pattern is worth
 * more than saving one query). */
export async function saveStudioConfig(
  studioId: string,
  _prevState: StudioConfigActionState,
  formData: FormData,
): Promise<StudioConfigActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = studioConfigInputSchema.safeParse({ ...raw, studio_id: studioId });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("studio_configs")
    .select("id")
    .eq("studio_id", studioId)
    .limit(1);

  const existingId = existing?.[0]?.id;
  const { error } = existingId
    ? await supabase
        .from("studio_configs")
        .update(parsed.data)
        .eq("id", existingId)
    : await supabase.from("studio_configs").insert(parsed.data);

  if (error) return { error: error.message, success: false };

  revalidatePath(`/studio-config/${studioId}`);
  return { error: null, success: true };
}
