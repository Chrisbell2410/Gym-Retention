import { z } from "zod";

/** All five assumptions behind the Response Time Report's revenue-leak
 * estimate — every one editable, per lib/revenue-leak.ts's "no inflated
 * claims" design: the report should always show its work. */
export const revenueLeakAssumptionsSchema = z.object({
  leads_per_month: z.coerce.number().min(0).max(1000),
  close_rate_with_fast_response: z.coerce.number().min(0).max(1),
  close_rate_with_actual_response: z.coerce.number().min(0).max(1),
  monthly_membership_price: z.coerce.number().min(0).max(10000),
  avg_months_retained: z.coerce.number().min(0).max(120),
});

export type RevenueLeakAssumptionsInput = z.infer<
  typeof revenueLeakAssumptionsSchema
>;
