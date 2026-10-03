import { z } from "zod";

/**
 * Secret-shop log entries. Timestamps arrive already converted to ISO
 * strings by the form (see secret-shop-log-dialog.tsx's hidden-input
 * pattern) — the browser does the local-time-to-ISO conversion, so this
 * never has to guess what timezone the server is running in.
 */

const CHANNEL_VALUES = ["web_form", "instagram_dm", "phone", "email"] as const;

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const isoDateString = z.string().refine(
  (v) => !Number.isNaN(Date.parse(v)),
  "That doesn't look like a valid date/time",
);

export const secretShopLogInputSchema = z.object({
  studio_id: z.string().uuid("Pick a studio"),
  channel: z.enum(CHANNEL_VALUES),
  sent_at: isoDateString,
  first_reply_at: z.preprocess(
    emptyToUndefined,
    isoDateString.optional(),
  ).transform((v) => v ?? null),
  reply_quality: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(5).optional(),
  ),
  offered_booking: z.preprocess(
    (v) => v === "on" || v === true,
    z.boolean(),
  ),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
}).refine(
  (data) =>
    !data.first_reply_at ||
    new Date(data.first_reply_at) >= new Date(data.sent_at),
  { message: "Reply time can't be before the sent time", path: ["first_reply_at"] },
);

export type SecretShopLogInput = z.infer<typeof secretShopLogInputSchema>;
