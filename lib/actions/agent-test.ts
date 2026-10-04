"use server";

import { createClient } from "@/lib/supabase/server";
import { processIncomingMessage } from "@/lib/agent-runtime";
import type { ProcessMessageResult } from "@/lib/agent-runtime";

/** Starts a throwaway test conversation against a real studio_config,
 * using Chris's own authenticated session (not the public/admin path the
 * real chat widget will use). consent_source marks it clearly as
 * internal so it's never confused with a real lead in reporting later. */
export async function startTestConversation(
  studioConfigId: string,
): Promise<{ conversationId: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      studio_config_id: studioConfigId,
      channel: "chat_widget",
      contact_identifier: `internal-test-${crypto.randomUUID()}`,
      contact_name: "Test lead",
      consent_given: true,
      consent_source: "internal_test_harness",
      consent_timestamp: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { conversationId: null, error: error?.message ?? "Failed to start" };
  }
  return { conversationId: data.id, error: null };
}

export async function sendTestMessage(
  conversationId: string,
  message: string,
): Promise<ProcessMessageResult> {
  const supabase = await createClient();
  return processIncomingMessage(supabase, conversationId, message);
}
