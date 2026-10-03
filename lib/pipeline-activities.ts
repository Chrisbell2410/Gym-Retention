/**
 * Shared helper for recording a stage change in pipeline_activities.
 * Deliberately NOT a "use server" file — it takes a live Supabase client
 * as an argument (not serializable), so it must only ever be called from
 * other server-side code (other server actions), never directly from a
 * client component. See lib/actions/studios.ts and
 * lib/actions/pipeline-activities.ts for the actual callable actions.
 */
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function logStageChange(
  supabase: SupabaseServerClient,
  studioId: string,
  previousStage: string,
  newStage: string,
  note?: string,
) {
  if (previousStage === newStage) return;
  await supabase.from("pipeline_activities").insert({
    studio_id: studioId,
    type: "stage_change",
    previous_stage: previousStage,
    new_stage: newStage,
    note: note ?? null,
  });
}
