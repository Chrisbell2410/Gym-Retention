"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Seeds a fake, fully-configured "demo studio" under Chris's own account —
 * believable enough to show in a pitch meeting, tagged `is_demo: true` on
 * its studio_configs row so it's never confused with a real customer's
 * data. Two profiles exist: a generic one (fake name/address/contact, same
 * posture as supabase/seed.sql) for pitching studios in general, and a
 * btone-specific one for the actual btone FITNESS James Island pitch —
 * its class format, pricing, and copy are pulled from btone's own public
 * website (btonefitness.com), used here only as a rehearsal/demo aid for
 * a meeting Chris is presenting directly to btone's own staff, not shown
 * to any other prospect.
 *
 * Uses the authenticated client (not the admin one) specifically so
 * owner_id resolves from Chris's own session automatically — no need to
 * know his user id or touch the database directly. Idempotent per
 * profile, keyed by studio name: re-seeding returns the existing demo
 * studio's ids instead of inserting a duplicate.
 */

export interface SeedDemoResult {
  error: string | null;
  studioId: string | null;
  studioConfigId: string | null;
  alreadyExisted: boolean;
}

interface SampleMessage {
  from: "lead" | "ai";
  body: string;
}

interface DemoProfile {
  studioName: string;
  studio: {
    address: string;
    neighborhood: string;
    phone: string;
    website: string;
    instagramHandle: string;
    category: string;
    rating: number;
    reviewCount: number;
    notes: string;
  };
  config: {
    brandVoice: string;
    classTypes: string[];
    schedule: { dayOfWeek: number; time: string; className: string; capacity: number }[];
    introOffer: string;
    pricing: { name: string; price: number; description?: string }[];
    faqs: { question: string; answer: string }[];
    cancellationPolicy: string;
    lateArrivalPolicy: string;
    locationParking: string;
    escalationContactName: string;
    escalationContactPhone: string;
    escalationContactEmail: string;
  };
  bookedConvo: { leadName: string; className: string; classTime: string; messages: SampleMessage[] };
  faqConvo: { leadName: string; messages: SampleMessage[] };
  escalatedConvo: { leadName: string; messages: SampleMessage[] };
}

const GENERIC_PROFILE: DemoProfile = {
  studioName: "Lowcountry Pilates & Yoga",
  studio: {
    address: "1521 Folly Rd, James Island, SC",
    neighborhood: "james_island",
    phone: "843-555-0190",
    website: "https://lowcountrypilatesyoga.example.com",
    instagramHandle: "@lowcountrypilatesyoga",
    category: "pilates",
    rating: 4.9,
    reviewCount: 184,
    notes: "Demo studio — fake data, used for pitch meetings only. Not a real prospect or customer.",
  },
  config: {
    brandVoice: "Warm, down-to-earth, and encouraging — like a knowledgeable friend, never a hard sell.",
    classTypes: ["Reformer Pilates", "Mat Pilates", "Vinyasa Yoga", "Restorative Yoga"],
    schedule: [
      { dayOfWeek: 1, time: "09:00", className: "Reformer Pilates", capacity: 10 },
      { dayOfWeek: 1, time: "18:00", className: "Vinyasa Yoga", capacity: 16 },
      { dayOfWeek: 3, time: "09:00", className: "Mat Pilates", capacity: 14 },
      { dayOfWeek: 3, time: "18:00", className: "Reformer Pilates", capacity: 10 },
      { dayOfWeek: 5, time: "08:00", className: "Vinyasa Yoga", capacity: 16 },
      { dayOfWeek: 6, time: "10:00", className: "Restorative Yoga", capacity: 14 },
    ],
    introOffer: "First class free, or 3 classes for $59",
    pricing: [
      { name: "Drop-in", price: 28 },
      { name: "8-Class Pack", price: 184, description: "$23/class" },
      { name: "Unlimited Monthly", price: 169 },
    ],
    faqs: [
      {
        question: "Do you offer childcare?",
        answer: "Not at this time, but we're a stroller-friendly studio and happy to have little ones wait in our lobby.",
      },
      {
        question: "What should I bring to my first class?",
        answer: "Just comfortable clothes and water — we provide mats and reformers.",
      },
    ],
    cancellationPolicy: "Cancel up to 12 hours before class for a full credit back. No-shows forfeit the class.",
    lateArrivalPolicy: "Please arrive 10 minutes early — for safety on the reformers, we can't admit anyone after class starts.",
    locationParking: "1521 Folly Rd, James Island — free lot parking right out front.",
    escalationContactName: "Maddie Simmons, Studio Manager",
    escalationContactPhone: "843-555-0191",
    escalationContactEmail: "maddie@lowcountrypilatesyoga.example.com",
  },
  bookedConvo: {
    leadName: "Taylor R.",
    className: "Reformer Pilates",
    classTime: "Monday at 9:00 AM",
    messages: [
      { from: "lead", body: "Hi! What's your intro offer?" },
      { from: "ai", body: "Hey there! We've got first class free, or 3 classes for $59 if you'd like to try a few. Want me to find you a spot?" },
      { from: "lead", body: "Yes, Monday morning works" },
      { from: "ai", body: "You're all set for Reformer Pilates on Monday at 9:00 AM — can't wait to see you, Taylor!" },
    ],
  },
  faqConvo: {
    leadName: "Casey L.",
    messages: [
      { from: "lead", body: "Do you have childcare?" },
      { from: "ai", body: "Not at this time, but we're a stroller-friendly studio and happy to have little ones wait in our lobby. Want to grab a spot in an intro class?" },
    ],
  },
  escalatedConvo: {
    leadName: "Jordan M.",
    messages: [
      { from: "lead", body: "I signed up last week but need to ask about a refund" },
      { from: "ai", body: "I want to make sure you get the right help with that — I'm looping in a team member who'll follow up shortly." },
    ],
  },
};

/** Class format, pricing, address, and policy copy pulled from
 * btonefitness.com/locations/james-island, /pricing/james-island, and
 * /pre-opening/james-island (fetched 2026-10-20) — real public info about
 * an actual pre-opening location, used here as a rehearsal aid for the
 * meeting Chris is presenting directly to btone's own staff. */
const BTONE_PROFILE: DemoProfile = {
  studioName: "btone FITNESS – James Island",
  studio: {
    address: "1291 Folly Rd, James Island, SC 29412 (Island Plaza)",
    neighborhood: "james_island",
    phone: "843-555-0192",
    website: "https://www.btonefitness.com/locations/james-island",
    instagramHandle: "@btonefitness",
    category: "pilates",
    rating: 4.8,
    reviewCount: 0,
    notes: "Demo studio (pitch rehearsal) — class format, pricing, and policy copy pulled from btone's real public website for the James Island pre-opening location. Used only to demo the product directly to btone's own staff, not shown to other prospects.",
  },
  config: {
    brandVoice: "Energetic, motivational, and results-driven, but approachable — \"Slow Movements, Fast Results.\" Confident, never corporate.",
    classTypes: ["btFORMER Reformer Class"],
    schedule: [
      { dayOfWeek: 1, time: "06:00", className: "btFORMER Reformer Class", capacity: 12 },
      { dayOfWeek: 1, time: "17:30", className: "btFORMER Reformer Class", capacity: 12 },
      { dayOfWeek: 2, time: "09:00", className: "btFORMER Reformer Class", capacity: 12 },
      { dayOfWeek: 3, time: "06:00", className: "btFORMER Reformer Class", capacity: 12 },
      { dayOfWeek: 3, time: "17:30", className: "btFORMER Reformer Class", capacity: 12 },
      { dayOfWeek: 5, time: "09:00", className: "btFORMER Reformer Class", capacity: 12 },
      { dayOfWeek: 6, time: "08:00", className: "btFORMER Reformer Class", capacity: 12 },
    ],
    introOffer: "Pre-opening special: Founding Unlimited Membership for $149/mo, or 8 classes for $99 (one offer per person)",
    pricing: [
      { name: "Founding Unlimited Membership (pre-opening)", price: 149, description: "/mo — deepest discount offered" },
      { name: "8-Class Pack (pre-opening)", price: 99 },
    ],
    faqs: [
      {
        question: "What is a btFORMER class like?",
        answer: "A 45-minute hybrid of Pilates-inspired movements and strength training on our custom reformer equipment — \"Slow Movements, Fast Results.\" It's smart, intense, and results-oriented.",
      },
      {
        question: "Do you offer childcare?",
        answer: "Yes, we offer childcare during select classes.",
      },
      {
        question: "Is there parking?",
        answer: "Yes, free parking right at Island Plaza.",
      },
    ],
    cancellationPolicy: "8-hour notice required before any schedule change — our motivation policy.",
    lateArrivalPolicy: "Please arrive a few minutes early — for safety on the reformers, late entry isn't permitted once class starts.",
    locationParking: "1291 Folly Rd, James Island (Island Plaza, next to Nails So Dep) — free parking on site.",
    escalationContactName: "Studio Manager",
    escalationContactPhone: "843-555-0193",
    escalationContactEmail: "jamesisland@btonefitness.com",
  },
  bookedConvo: {
    leadName: "Taylor R.",
    className: "btFORMER Reformer Class",
    classTime: "Monday at 6:00 AM",
    messages: [
      { from: "lead", body: "Hi! What's your pre-opening offer?" },
      { from: "ai", body: "We've got a Founding Unlimited Membership for $149/mo, or 8 classes for $99 — our deepest discount, one per person. Want me to grab you a spot in a class?" },
      { from: "lead", body: "Yes, early Monday works best for me" },
      { from: "ai", body: "You're booked for btFORMER on Monday at 6:00 AM — can't wait to see you, Taylor!" },
    ],
  },
  faqConvo: {
    leadName: "Casey L.",
    messages: [
      { from: "lead", body: "What's a btFORMER class actually like?" },
      { from: "ai", body: "It's a 45-minute hybrid of Pilates-inspired movements and strength training on our reformers — slow movements, fast results. Smart, intense, and results-oriented. Want to grab a spot?" },
    ],
  },
  escalatedConvo: {
    leadName: "Jordan M.",
    messages: [
      { from: "lead", body: "I have a lower back injury, is this class safe for me?" },
      { from: "ai", body: "I want to make sure you get the right guidance on that — I'm looping in a team member who'll follow up shortly." },
    ],
  },
};

async function seedProfile(profile: DemoProfile): Promise<SeedDemoResult> {
  const supabase = await createClient();

  const { data: existingStudio } = await supabase
    .from("studios")
    .select("id")
    .eq("name", profile.studioName)
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
      name: profile.studioName,
      address: profile.studio.address,
      neighborhood: profile.studio.neighborhood,
      phone: profile.studio.phone,
      website: profile.studio.website,
      instagram_handle: profile.studio.instagramHandle,
      category: profile.studio.category,
      rating: profile.studio.rating,
      review_count: profile.studio.reviewCount,
      is_franchise: false,
      booking_platform: "mindbody",
      booking_platform_source: "manual",
      on_classpass: true,
      intro_offer: profile.config.introOffer,
      class_price: profile.config.pricing[0]?.price ?? null,
      estimated_size: "medium",
      pipeline_stage: "paying",
      notes: profile.studio.notes,
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
      brand_voice: profile.config.brandVoice,
      class_types: profile.config.classTypes,
      schedule: profile.config.schedule,
      intro_offer: profile.config.introOffer,
      pricing: profile.config.pricing,
      faqs: profile.config.faqs,
      cancellation_policy: profile.config.cancellationPolicy,
      late_arrival_policy: profile.config.lateArrivalPolicy,
      location_parking: profile.config.locationParking,
      escalation_contact_name: profile.config.escalationContactName,
      escalation_contact_phone: profile.config.escalationContactPhone,
      escalation_contact_email: profile.config.escalationContactEmail,
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

  await seedDemoActivity(supabase, config.id, profile);

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

export async function seedDemoStudio(): Promise<SeedDemoResult> {
  return seedProfile(GENERIC_PROFILE);
}

export async function seedBtoneDemoStudio(): Promise<SeedDemoResult> {
  return seedProfile(BTONE_PROFILE);
}

/** A handful of fake conversations/messages/bookings so there's believable
 * activity to show — one normal booking, one FAQ-only inquiry, one
 * escalation — covering the same three outcomes the agent test checklist
 * exercises, just pre-populated instead of live. */
async function seedDemoActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studioConfigId: string,
  profile: DemoProfile,
) {
  const now = Date.now();
  const daysAgo = (d: number, h = 0) =>
    new Date(now - d * 86400000 + h * 3600000).toISOString();

  async function insertConvo(
    contactName: string,
    status: "active" | "handed_off",
    createdDaysAgo: number,
    messages: SampleMessage[],
  ) {
    const { data: convo } = await supabase
      .from("conversations")
      .insert({
        studio_config_id: studioConfigId,
        channel: "chat_widget",
        contact_name: contactName,
        contact_identifier: `demo-visitor-${contactName.toLowerCase().replace(/[^a-z]/g, "")}`,
        status,
        consent_given: true,
        consent_source: "chat_widget",
        consent_timestamp: daysAgo(createdDaysAgo),
        created_at: daysAgo(createdDaysAgo),
      })
      .select("id")
      .single();

    if (!convo) return null;

    await supabase.from("messages").insert(
      messages.map((m, i) => ({
        conversation_id: convo.id,
        direction: m.from === "lead" ? ("inbound" as const) : ("outbound" as const),
        sender: m.from === "lead" ? ("lead" as const) : ("ai" as const),
        body: m.body,
        created_at: daysAgo(createdDaysAgo, i * 0.02),
      })),
    );

    return convo.id;
  }

  const bookedConvoId = await insertConvo(
    profile.bookedConvo.leadName,
    "active",
    3,
    profile.bookedConvo.messages,
  );
  if (bookedConvoId) {
    await supabase.from("bookings").insert({
      studio_config_id: studioConfigId,
      conversation_id: bookedConvoId,
      lead_name: profile.bookedConvo.leadName,
      lead_contact: `${profile.bookedConvo.leadName.split(" ")[0].toLowerCase()}@example.com`,
      class_name: profile.bookedConvo.className,
      class_datetime: daysAgo(-4, 9),
      status: "booked",
    });
  }

  await insertConvo(profile.faqConvo.leadName, "active", 1, profile.faqConvo.messages);
  await insertConvo(profile.escalatedConvo.leadName, "handed_off", 2, profile.escalatedConvo.messages);
}
