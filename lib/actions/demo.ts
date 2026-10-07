"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Seeds one fake, fully-configured "demo studio" under Chris's own
 * account — believable enough to show in a pitch meeting, clearly fake
 * (name/address/contact are all invented, same posture as supabase/seed.sql),
 * and tagged `is_demo: true` on its studio_configs row so it's never
 * confused with a real customer's data.
 *
 * Uses the authenticated client (not the admin one) specifically so
 * owner_id resolves from Chris's own session automatically — no need to
 * know his user id or touch the database directly. Idempotent: if the
 * demo studio already exists under this account, returns its existing
 * ids instead of inserting a duplicate.
 */

const DEMO_STUDIO_NAME = "Lowcountry Pilates & Yoga";

export interface SeedDemoResult {
  error: string | null;
  studioId: string | null;
  studioConfigId: string | null;
  alreadyExisted: boolean;
}

export async function seedDemoStudio(): Promise<SeedDemoResult> {
  const supabase = await createClient();

  const { data: existingStudio } = await supabase
    .from("studios")
    .select("id")
    .eq("name", DEMO_STUDIO_NAME)
    .maybeSingle();

  if (existingStudio) {
    const { data: existingConfig } = await supabase
      .from("studio_configs")
      .select("id")
      .eq("studio_id", existingStudio.id)
      .maybeSingle();

    return {
      error: null,
      studioId: existingStudio.id,
      studioConfigId: existingConfig?.id ?? null,
      alreadyExisted: true,
    };
  }

  const { data: studio, error: studioError } = await supabase
    .from("studios")
    .insert({
      name: DEMO_STUDIO_NAME,
      address: "1521 Folly Rd, James Island, SC",
      neighborhood: "james_island",
      phone: "843-555-0190",
      website: "https://lowcountrypilatesyoga.example.com",
      instagram_handle: "@lowcountrypilatesyoga",
      category: "pilates",
      rating: 4.9,
      review_count: 184,
      is_franchise: false,
      booking_platform: "mindbody",
      booking_platform_source: "manual",
      on_classpass: true,
      intro_offer: "First class free, or 3 classes for $59",
      class_price: 28,
      estimated_size: "medium",
      pipeline_stage: "paying",
      notes:
        "Demo studio — fake data, used for pitch meetings only. Not a real prospect or customer.",
    })
    .select("id")
    .single();

  if (studioError || !studio) {
    return {
      error: studioError?.message ?? "Failed to create demo studio",
      studioId: null,
      studioConfigId: null,
      alreadyExisted: false,
    };
  }

  const { data: config, error: configError } = await supabase
    .from("studio_configs")
    .insert({
      studio_id: studio.id,
      is_demo: true,
      brand_voice:
        "Warm, down-to-earth, and encouraging — like a knowledgeable friend, never a hard sell.",
      class_types: ["Reformer Pilates", "Mat Pilates", "Vinyasa Yoga", "Restorative Yoga"],
      schedule: [
        { dayOfWeek: 1, time: "09:00", className: "Reformer Pilates", capacity: 10 },
        { dayOfWeek: 1, time: "18:00", className: "Vinyasa Yoga", capacity: 16 },
        { dayOfWeek: 3, time: "09:00", className: "Mat Pilates", capacity: 14 },
        { dayOfWeek: 3, time: "18:00", className: "Reformer Pilates", capacity: 10 },
        { dayOfWeek: 5, time: "08:00", className: "Vinyasa Yoga", capacity: 16 },
        { dayOfWeek: 6, time: "10:00", className: "Restorative Yoga", capacity: 14 },
      ],
      intro_offer: "First class free, or 3 classes for $59",
      pricing: [
        { name: "Drop-in", price: 28 },
        { name: "8-Class Pack", price: 184, description: "$23/class" },
        { name: "Unlimited Monthly", price: 169 },
      ],
      faqs: [
        {
          question: "Do you offer childcare?",
          answer:
            "Not at this time, but we're a stroller-friendly studio and happy to have little ones wait in our lobby.",
        },
        {
          question: "What should I bring to my first class?",
          answer:
            "Just comfortable clothes and water — we provide mats and reformers.",
        },
      ],
      cancellation_policy:
        "Cancel up to 12 hours before class for a full credit back. No-shows forfeit the class.",
      late_arrival_policy:
        "Please arrive 10 minutes early — for safety on the reformers, we can't admit anyone after class starts.",
      location_parking:
        "1521 Folly Rd, James Island — free lot parking right out front.",
      escalation_contact_name: "Maddie Simmons, Studio Manager",
      escalation_contact_phone: "843-555-0191",
      escalation_contact_email: "maddie@lowcountrypilatesyoga.example.com",
    })
    .select("id")
    .single();

  if (configError || !config) {
    return {
      error: configError?.message ?? "Failed to create demo studio config",
      studioId: studio.id,
      studioConfigId: null,
      alreadyExisted: false,
    };
  }

  await seedDemoActivity(supabase, config.id);

  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/agent-test");
  revalidatePath("/widget-preview");

  return {
    error: null,
    studioId: studio.id,
    studioConfigId: config.id,
    alreadyExisted: false,
  };
}

/** A handful of fake conversations/messages/bookings so there's believable
 * activity to show — one normal booking, one FAQ-only inquiry, one
 * escalation — covering the same three outcomes the agent test checklist
 * exercises, just pre-populated instead of live. */
async function seedDemoActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studioConfigId: string,
) {
  const now = Date.now();
  const daysAgo = (d: number, h = 0) =>
    new Date(now - d * 86400000 + h * 3600000).toISOString();

  const { data: bookedConvo } = await supabase
    .from("conversations")
    .insert({
      studio_config_id: studioConfigId,
      channel: "chat_widget",
      contact_name: "Taylor R.",
      contact_identifier: "demo-visitor-taylor",
      status: "active",
      consent_given: true,
      consent_source: "chat_widget",
      consent_timestamp: daysAgo(3),
      created_at: daysAgo(3),
    })
    .select("id")
    .single();

  if (bookedConvo) {
    await supabase.from("messages").insert([
      {
        conversation_id: bookedConvo.id,
        direction: "inbound",
        sender: "lead",
        body: "Hi! What's your intro offer?",
        created_at: daysAgo(3),
      },
      {
        conversation_id: bookedConvo.id,
        direction: "outbound",
        sender: "ai",
        body: "Hey there! We've got first class free, or 3 classes for $59 if you'd like to try a few. Want me to find you a spot?",
        created_at: daysAgo(3, 0.02),
      },
      {
        conversation_id: bookedConvo.id,
        direction: "inbound",
        sender: "lead",
        body: "Yes, Monday morning works",
        created_at: daysAgo(3, 0.05),
      },
      {
        conversation_id: bookedConvo.id,
        direction: "outbound",
        sender: "ai",
        body: "You're all set for Reformer Pilates on Monday at 9:00 AM — can't wait to see you, Taylor!",
        created_at: daysAgo(3, 0.07),
      },
    ]);

    await supabase.from("bookings").insert({
      studio_config_id: studioConfigId,
      conversation_id: bookedConvo.id,
      lead_name: "Taylor R.",
      lead_contact: "taylor.r@example.com",
      class_name: "Reformer Pilates",
      class_datetime: daysAgo(-4, 9),
      status: "booked",
    });
  }

  const { data: faqConvo } = await supabase
    .from("conversations")
    .insert({
      studio_config_id: studioConfigId,
      channel: "chat_widget",
      contact_name: "Casey L.",
      contact_identifier: "demo-visitor-casey",
      status: "active",
      consent_given: true,
      consent_source: "chat_widget",
      consent_timestamp: daysAgo(1),
      created_at: daysAgo(1),
    })
    .select("id")
    .single();

  if (faqConvo) {
    await supabase.from("messages").insert([
      {
        conversation_id: faqConvo.id,
        direction: "inbound",
        sender: "lead",
        body: "Do you have childcare?",
        created_at: daysAgo(1),
      },
      {
        conversation_id: faqConvo.id,
        direction: "outbound",
        sender: "ai",
        body: "Not at this time, but we're a stroller-friendly studio and happy to have little ones wait in our lobby. Want to grab a spot in an intro class?",
        created_at: daysAgo(1, 0.02),
      },
    ]);
  }

  const { data: escalatedConvo } = await supabase
    .from("conversations")
    .insert({
      studio_config_id: studioConfigId,
      channel: "chat_widget",
      contact_name: "Jordan M.",
      contact_identifier: "demo-visitor-jordan",
      status: "handed_off",
      consent_given: true,
      consent_source: "chat_widget",
      consent_timestamp: daysAgo(2),
      created_at: daysAgo(2),
    })
    .select("id")
    .single();

  if (escalatedConvo) {
    await supabase.from("messages").insert([
      {
        conversation_id: escalatedConvo.id,
        direction: "inbound",
        sender: "lead",
        body: "I signed up last week but need to ask about a refund",
        created_at: daysAgo(2),
      },
      {
        conversation_id: escalatedConvo.id,
        direction: "outbound",
        sender: "ai",
        body: "I want to make sure you get the right help with that — I'm looping in a team member who'll follow up shortly.",
        created_at: daysAgo(2, 0.02),
      },
    ]);
  }
}
