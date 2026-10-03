import { z } from "zod";

/**
 * Shared validation for a studio record — used by both the add/edit form
 * (lib/actions/studios.ts createStudio/updateStudio) and CSV import, so a
 * row that's good enough for one is good enough for the other.
 */

const NEIGHBORHOOD_VALUES = [
  "downtown_peninsula",
  "mount_pleasant",
  "west_ashley",
  "james_island",
  "daniel_island",
  "north_charleston_park_circle",
  "summerville",
  "other",
] as const;

const CATEGORY_VALUES = [
  "pilates",
  "yoga",
  "barre",
  "strength",
  "cycle",
  "hiit",
  "other",
] as const;

const BOOKING_PLATFORM_VALUES = [
  "mindbody",
  "momence",
  "mariana_tek",
  "walla",
  "glofox",
  "wellnessliving",
  "arketa",
  "vagaro",
  "zen_planner",
  "pushpress",
  "other",
  "unknown",
] as const;

const PIPELINE_STAGE_VALUES = [
  "researched",
  "secret_shopped",
  "contacted",
  "meeting_booked",
  "pilot",
  "paying",
  "lost",
] as const;

const ESTIMATED_SIZE_VALUES = ["small", "medium", "large"] as const;

/** "" (from a <select>'s empty option) becomes undefined, so optional() applies. */
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optionalText = () => z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToUndefined, z.enum(values).optional());

const TRUE_STRINGS = new Set(["true", "yes", "y", "1", "on"]);
const FALSE_STRINGS = new Set(["false", "no", "n", "0"]);

/** Parses a checkbox ("on"/missing, from a form) or a free-text CSV cell
 * ("true"/"yes"/"1"/etc.) into a strict boolean, defaulting to false. */
function toBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return TRUE_STRINGS.has(v.trim().toLowerCase());
  return false;
}
const requiredBoolean = z.preprocess(toBoolean, z.boolean());

/** Tri-state field (on ClassPass: unknown / yes / no). Unrecognized text
 * is treated as "unknown" (null) rather than guessed at. */
const optionalTriBoolean = z.preprocess((v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "") return null;
    if (TRUE_STRINGS.has(s)) return true;
    if (FALSE_STRINGS.has(s)) return false;
  }
  return null;
}, z.boolean().nullable());

export const studioInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: optionalText(),
  neighborhood: optionalEnum(NEIGHBORHOOD_VALUES),
  phone: optionalText(),
  website: optionalText(),
  instagram_handle: optionalText(),
  category: optionalEnum(CATEGORY_VALUES),
  rating: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).max(5).optional(),
  ),
  review_count: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).optional(),
  ),
  is_franchise: requiredBoolean,
  franchise_brand: optionalText(),
  booking_platform: optionalEnum(BOOKING_PLATFORM_VALUES),
  on_classpass: optionalTriBoolean,
  intro_offer: optionalText(),
  class_price: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).optional(),
  ),
  estimated_size: optionalEnum(ESTIMATED_SIZE_VALUES),
  notes: optionalText(),
  pipeline_stage: optionalEnum(PIPELINE_STAGE_VALUES).default("researched"),
  lost_reason: optionalText(),
  next_action: optionalText(),
  next_action_date: optionalText(),
});

export type StudioInput = z.infer<typeof studioInputSchema>;

// CSV rows are validated with this same schema (toBoolean/optionalText/etc.
// all already tolerate free-text CSV values, not just form data) — see
// lib/actions/studios.ts importStudiosFromCsv.
