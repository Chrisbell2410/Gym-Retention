import { z } from "zod";

/** One weekly-recurring bookable slot. */
export const scheduleEntrySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  className: z.string().trim().min(1),
  capacity: z.coerce.number().int().min(1).max(100),
});

export const pricingOptionSchema = z.object({
  name: z.string().trim().min(1),
  price: z.coerce.number().min(0),
  description: z.string().trim().optional(),
});

export const faqSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optionalText = () => z.preprocess(emptyToUndefined, z.string().trim().optional());

/** JSON-array fields arrive as a stringified JSON blob from a hidden form
 * input (see JsonListEditor) — parsed and validated here rather than
 * trusting the client's serialization. */
function jsonArrayField<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.preprocess((v) => {
    if (typeof v !== "string" || v.trim() === "") return [];
    try {
      return JSON.parse(v);
    } catch {
      return [];
    }
  }, z.array(itemSchema));
}

/** Simpler than the others — just a comma-separated text input, not a
 * repeating-row editor (no per-item sub-fields needed). */
const commaSeparatedList = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}, z.array(z.string()));

export const studioConfigInputSchema = z.object({
  studio_id: z.string().uuid(),
  brand_voice: optionalText(),
  class_types: commaSeparatedList,
  schedule: jsonArrayField(scheduleEntrySchema),
  intro_offer: optionalText(),
  pricing: jsonArrayField(pricingOptionSchema),
  faqs: jsonArrayField(faqSchema),
  cancellation_policy: optionalText(),
  late_arrival_policy: optionalText(),
  location_parking: optionalText(),
  escalation_contact_name: optionalText(),
  escalation_contact_phone: optionalText(),
  escalation_contact_email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email().optional(),
  ),
});

export type StudioConfigInput = z.infer<typeof studioConfigInputSchema>;
