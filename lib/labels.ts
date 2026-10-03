/**
 * Display labels + colors for the enum-like text columns in the schema
 * (supabase/migrations/0001_init.sql check constraints). Centralized here
 * so every screen (Prospects, Pipeline, Secret Shop, ...) renders the same
 * label/color for the same underlying value.
 */

export const NEIGHBORHOOD_LABELS: Record<string, string> = {
  downtown_peninsula: "Downtown / Peninsula",
  mount_pleasant: "Mount Pleasant",
  west_ashley: "West Ashley",
  james_island: "James Island",
  daniel_island: "Daniel Island",
  north_charleston_park_circle: "North Charleston / Park Circle",
  summerville: "Summerville",
  other: "Other",
};

export const CATEGORY_LABELS: Record<string, string> = {
  pilates: "Pilates",
  yoga: "Yoga",
  barre: "Barre",
  strength: "Strength",
  cycle: "Cycling",
  hiit: "HIIT",
  other: "Other",
};

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  researched: "Researched",
  secret_shopped: "Secret-Shopped",
  contacted: "Contacted",
  meeting_booked: "Meeting Booked",
  pilot: "Pilot",
  paying: "Paying",
  lost: "Lost",
};

export const PIPELINE_STAGES = Object.keys(PIPELINE_STAGE_LABELS);

/** The forward-moving columns, excluding "lost" — "lost" is a branch off
 * the sequence, not a rung on it, so it's handled separately (via the full
 * edit dialog, which requires a reason) rather than with next/back arrows. */
export const SEQUENTIAL_PIPELINE_STAGES = PIPELINE_STAGES.filter(
  (s) => s !== "lost",
);

export const BOOKING_PLATFORM_LABELS: Record<string, string> = {
  mindbody: "Mindbody",
  momence: "Momence",
  mariana_tek: "Mariana Tek",
  walla: "Walla",
  glofox: "Glofox",
  wellnessliving: "WellnessLiving",
  arketa: "Arketa",
  vagaro: "Vagaro",
  zen_planner: "Zen Planner",
  pushpress: "PushPress",
  other: "Other",
  unknown: "Unknown",
};

export const ESTIMATED_SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export const SECRET_SHOP_CHANNEL_LABELS: Record<string, string> = {
  web_form: "Web form",
  instagram_dm: "Instagram DM",
  phone: "Phone",
  email: "Email",
};

/** Tailwind classes per pipeline stage — intentionally sparing with the
 * brand accent colors (spark/harbor) so they stay meaningful; the middle
 * stages use neutral ink tones rather than a color-per-stage rainbow. */
export const PIPELINE_STAGE_BADGE_CLASSES: Record<string, string> = {
  researched: "bg-ink-100 text-ink-600",
  secret_shopped: "bg-ink-100 text-ink-600",
  contacted: "bg-ink-100 text-ink-600",
  meeting_booked: "bg-ink-200 text-ink-700",
  pilot: "bg-harbor-100 text-harbor-700",
  paying: "bg-spark-100 text-spark-700",
  lost: "bg-ink-100 text-ink-400",
};
