"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logStageChange } from "@/lib/pipeline-activities";
import type { Database } from "@/types/supabase";

type ActivityRow = Database["public"]["Tables"]["pipeline_activities"]["Row"];

const ACTIVITY_TYPES = ["note", "call", "email", "meeting"] as const;
const STAGE_VALUES = [
  "researched",
  "secret_shopped",
  "contacted",
  "meeting_booked",
  "pilot",
  "paying",
  "lost",
] as const;

export async function getStudioActivities(
  studioId: string,
): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pipeline_activities")
    .select("*")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function addPipelineActivity(
  studioId: string,
  type: string,
  note: string,
): Promise<{ error: string | null }> {
  if (!ACTIVITY_TYPES.includes(type as (typeof ACTIVITY_TYPES)[number])) {
    return { error: "Invalid activity type" };
  }
  if (!note.trim()) {
    return { error: "Note can't be empty" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pipeline_activities").insert({
    studio_id: studioId,
    type,
    note: note.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/prospects");
  return { error: null };
}

/** Quick stage move from a kanban card — no form, just "which column did
 * this get dropped/clicked into." `lostReason` is only used when moving
 * into "lost" (and is required there — enforced by the caller showing a
 * prompt rather than here, since this has no form to show a field error
 * on; the Prospects/Pipeline full-edit dialog is the form-validated path
 * for setting a lost reason). */
export async function changeStudioStage(
  studioId: string,
  newStage: string,
  lostReason?: string,
): Promise<{ error: string | null }> {
  if (!STAGE_VALUES.includes(newStage as (typeof STAGE_VALUES)[number])) {
    return { error: "Invalid stage" };
  }

  const supabase = await createClient();
  const { data: studio } = await supabase
    .from("studios")
    .select("pipeline_stage")
    .eq("id", studioId)
    .single();

  if (!studio) return { error: "Studio not found" };
  if (studio.pipeline_stage === newStage) return { error: null };

  const { error } = await supabase
    .from("studios")
    .update({
      pipeline_stage: newStage,
      lost_reason: newStage === "lost" ? (lostReason ?? null) : null,
    })
    .eq("id", studioId);

  if (error) return { error: error.message };

  await logStageChange(supabase, studioId, studio.pipeline_stage, newStage);

  revalidatePath("/pipeline");
  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  return { error: null };
}
