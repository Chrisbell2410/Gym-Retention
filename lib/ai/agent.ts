import { DEFAULT_MODEL, getClaudeClient } from "./claude";
import type { AvailableSlot } from "@/lib/providers/booking/types";

/**
 * The front-desk AI agent's core turn logic — given a studio's config,
 * conversation history, and a new inbound message, decide what to say and
 * whether to book a class or hand off to a human. Deliberately uses
 * Claude's tool-use API rather than parsing free text for intent: asking
 * the model to call `book_class`/`escalate_to_human` as structured actions
 * is far more reliable than regex-matching "yes, book me in" out of
 * freeform prose, and it's the only way to be confident an escalation
 * trigger actually fires every time rather than most of the time.
 *
 * This module has no DB/HTTP dependencies of its own — see
 * lib/agent-runtime.ts for the piece that wires this to Supabase and the
 * BookingProvider. Keeping this pure makes it directly unit-testable and
 * is what the internal test harness (app/(internal)/agent-test) calls.
 */

export interface AgentStudioContext {
  studioName: string;
  brandVoice: string | null;
  classTypes: string[];
  introOffer: string | null;
  pricing: { name: string; price: number; description?: string }[];
  faqs: { question: string; answer: string }[];
  cancellationPolicy: string | null;
  lateArrivalPolicy: string | null;
  locationParking: string | null;
}

export interface AgentMessage {
  role: "lead" | "ai";
  body: string;
}

export type AgentAction =
  | { type: "none" }
  | {
      type: "book_class";
      className: string;
      datetime: string;
      leadName: string;
      leadContact?: string;
    }
  | { type: "escalate"; reason: string };

export interface AgentResult {
  reply: string;
  action: AgentAction;
}

const TOOLS = [
  {
    name: "book_class",
    description:
      "Books the lead into an intro class. Only call this once the lead has clearly agreed to one specific class and time from the AVAILABLE SLOTS list, and you have their name.",
    input_schema: {
      type: "object" as const,
      properties: {
        className: { type: "string" as const },
        datetime: {
          type: "string" as const,
          description:
            "The exact ISO datetime of the chosen slot, copied verbatim from the AVAILABLE SLOTS list — never a time that isn't listed.",
        },
        leadName: { type: "string" as const },
        leadContact: {
          type: "string" as const,
          description: "Phone number or email, only if the lead has given one.",
        },
      },
      required: ["className", "datetime", "leadName"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Hands the conversation off to a human team member. Call this immediately — before trying to answer — for: an injury, pregnancy, any medical question, a complaint, a refund request, a cancellation, or any explicit request to talk to a person.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string" as const,
          description: "One short phrase describing why this needs a human.",
        },
      },
      required: ["reason"],
    },
  },
];

function buildSystemPrompt(
  studio: AgentStudioContext,
  slots: AvailableSlot[],
): string {
  const pricingLines =
    studio.pricing
      .map(
        (p) =>
          `${p.name} — $${p.price}${p.description ? ` (${p.description})` : ""}`,
      )
      .join("; ") || "not specified — don't guess a price";

  const faqLines =
    studio.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n") ||
    "none on file";

  const slotLines = slots.length
    ? slots
        .map(
          (s) =>
            `- ${s.className} at ${s.datetime} (${new Date(s.datetime).toLocaleString()}), ${s.spotsLeft} spot(s) left`,
        )
        .join("\n")
    : "No open slots right now — tell the lead a team member will follow up to find a time. Do not invent a slot.";

  return `
You are the front-desk AI chat agent for ${studio.studioName}, a boutique fitness studio. A lead is messaging you through the studio's website chat widget.

VOICE: ${studio.brandVoice ?? "Friendly, warm, concise. Short sentences. No corporate jargon, no hard selling."}

YOUR GOAL: get the lead booked into an intro class from the AVAILABLE SLOTS below. Keep every reply short — 1 to 4 sentences.

HARD RULES, NEVER BROKEN:
1. Only state facts explicitly listed below. Never invent a price, policy, class time, or any claim not given to you here. If asked something not covered, say a team member will follow up — don't guess, don't improvise, don't estimate.
2. If the lead mentions an injury, pregnancy, any medical condition or question, a complaint, a refund, a cancellation, or explicitly asks to talk to a real person — call escalate_to_human immediately, before saying anything else about the topic. This overrides everything else, including a booking in progress.
3. Only call book_class with a className and datetime copied exactly from AVAILABLE SLOTS — never a time that isn't listed there.
4. Never pressure or guilt the lead. If they say no or seem uninterested, politely leave the door open and stop pushing.

STUDIO FACTS (the ONLY source of truth — nothing outside this list is real):
- Class types offered: ${studio.classTypes.join(", ") || "not specified"}
- Intro offer: ${studio.introOffer ?? "not specified"}
- Membership pricing: ${pricingLines}
- Cancellation policy: ${studio.cancellationPolicy ?? "not specified"}
- Late arrival policy: ${studio.lateArrivalPolicy ?? "not specified"}
- Location / parking: ${studio.locationParking ?? "not specified"}
- FAQs:
${faqLines}

AVAILABLE SLOTS (book only from this exact list):
${slotLines}
`.trim();
}

export async function runAgentTurn(
  studio: AgentStudioContext,
  history: AgentMessage[],
  newMessage: string,
  slots: AvailableSlot[],
): Promise<AgentResult> {
  const client = getClaudeClient();

  const messages = [
    ...history.map((m) => ({
      role: m.role === "lead" ? ("user" as const) : ("assistant" as const),
      content: m.body,
    })),
    { role: "user" as const, content: newMessage },
  ];

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(studio, slots),
    tools: TOOLS,
    messages,
  });

  let replyText = "";
  let action: AgentAction = { type: "none" };

  for (const block of response.content) {
    if (block.type === "text") {
      replyText += block.text;
    } else if (block.type === "tool_use") {
      if (block.name === "book_class") {
        const input = block.input as {
          className: string;
          datetime: string;
          leadName: string;
          leadContact?: string;
        };
        action = {
          type: "book_class",
          className: input.className,
          datetime: input.datetime,
          leadName: input.leadName,
          leadContact: input.leadContact,
        };
      } else if (block.name === "escalate_to_human") {
        const input = block.input as { reason: string };
        action = { type: "escalate", reason: input.reason };
      }
    }
  }

  // The model sometimes calls a tool with no accompanying text block.
  if (!replyText.trim()) {
    replyText =
      action.type === "escalate"
        ? "I want to make sure you get the right help with that — I'm looping in a team member who'll follow up shortly."
        : action.type === "book_class"
          ? "You're booked in — can't wait to see you!"
          : "Let me check on that and get back to you.";
  }

  return { reply: replyText.trim(), action };
}
