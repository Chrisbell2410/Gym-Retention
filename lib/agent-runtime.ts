/**
 * Wires lib/ai/agent.ts's pure turn logic to Supabase and the
 * BookingProvider: loads context, calls the agent, persists the
 * conversation, and executes whatever action it decided on. Used by both
 * the internal test harness and (once built) the public chat widget API
 * route — same function, different caller, different Supabase client
 * (authenticated vs. admin).
 *
 * Not a "use server" file — like lib/pipeline-activities.ts, it takes a
 * live Supabase client as an argument, so it's only ever called from
 * actual server actions / route handlers, never directly from the client.
 */
import type { createClient, createAdminClient } from "@/lib/supabase/server";
import { runAgentTurn } from "@/lib/ai/agent";
import type { AgentMessage, AgentStudioContext } from "@/lib/ai/agent";
import { MockBookingProvider } from "@/lib/providers/booking/mock";

type SupabaseLike =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

export interface ProcessMessageResult {
  reply: string;
  handedOff: boolean;
  booked: boolean;
  error: string | null;
}

export async function processIncomingMessage(
  supabase: SupabaseLike,
  conversationId: string,
  messageBody: string,
): Promise<ProcessMessageResult> {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, studio_config_id, status")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return { reply: "", handedOff: false, booked: false, error: "Conversation not found" };
  }

  const { data: config } = await supabase
    .from("studio_configs")
    .select("*, studios(name)")
    .eq("id", conversation.studio_config_id)
    .single();

  if (!config) {
    return { reply: "", handedOff: false, booked: false, error: "Studio config not found" };
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "inbound",
    sender: "lead",
    body: messageBody,
  });

  // Already handed off — don't let the AI jump back in over a human.
  if (conversation.status === "handed_off") {
    return { reply: "", handedOff: true, booked: false, error: null };
  }

  const { data: historyRows } = await supabase
    .from("messages")
    .select("sender, body")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const history: AgentMessage[] = (historyRows ?? [])
    .slice(0, -1) // the inbound message we just inserted is passed separately
    .map((m) => ({ role: m.sender === "lead" ? "lead" : "ai", body: m.body }));

  const booking = new MockBookingProvider(supabase);
  const slots = await booking.getAvailableSlots(conversation.studio_config_id, 7);

  const studioContext: AgentStudioContext = {
    studioName: config.studios?.name ?? "the studio",
    brandVoice: config.brand_voice,
    classTypes: (config.class_types as string[] | null) ?? [],
    introOffer: config.intro_offer,
    pricing:
      (config.pricing as AgentStudioContext["pricing"] | null) ?? [],
    faqs: (config.faqs as AgentStudioContext["faqs"] | null) ?? [],
    cancellationPolicy: config.cancellation_policy,
    lateArrivalPolicy: config.late_arrival_policy,
    locationParking: config.location_parking,
  };

  let result;
  try {
    result = await runAgentTurn(studioContext, history, messageBody, slots);
  } catch (e) {
    return {
      reply: "",
      handedOff: false,
      booked: false,
      error: e instanceof Error ? e.message : "AI request failed",
    };
  }

  let handedOff = false;
  let booked = false;

  if (result.action.type === "escalate") {
    handedOff = true;
    await supabase
      .from("conversations")
      .update({ status: "handed_off" })
      .eq("id", conversationId);
  } else if (result.action.type === "book_class") {
    try {
      await booking.bookClass({
        studioConfigId: conversation.studio_config_id,
        className: result.action.className,
        datetime: result.action.datetime,
        leadName: result.action.leadName,
        leadContact: result.action.leadContact,
        conversationId,
      });
      booked = true;
    } catch {
      // Slot likely got taken between offering it and the lead confirming
      // — don't crash the conversation over it, just don't mark it booked.
      // The reply the model already generated still goes out; worst case
      // the lead follows up and gets offered a fresh slot next turn.
    }
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "outbound",
    sender: "ai",
    body: result.reply,
  });

  return { reply: result.reply, handedOff, booked, error: null };
}
