/**
 * Server-only data loader for the Response Time Report's revenue-leak
 * assumptions — resolves in priority order: a per-studio override, then a
 * global default row (studio_id IS NULL), then the hardcoded constants in
 * lib/revenue-leak.ts. Not a "use server" action (nothing here mutates),
 * just a plain helper for the report's server component to call directly.
 */
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ASSUMPTIONS } from "@/lib/revenue-leak";
import type { RevenueLeakAssumptions } from "@/lib/revenue-leak";

export type AssumptionsSource = "studio" | "global" | "default";

function rowToAssumptions(row: {
  leads_per_month: number;
  close_rate_with_fast_response: number;
  close_rate_with_actual_response: number;
  monthly_membership_price: number;
  avg_months_retained: number;
}): RevenueLeakAssumptions {
  return {
    leadsPerMonth: row.leads_per_month,
    closeRateWithFastResponse: row.close_rate_with_fast_response,
    closeRateWithActualResponse: row.close_rate_with_actual_response,
    monthlyMembershipPrice: row.monthly_membership_price,
    avgMonthsRetained: row.avg_months_retained,
  };
}

export async function getResolvedAssumptions(
  studioId: string,
): Promise<{ assumptions: RevenueLeakAssumptions; source: AssumptionsSource }> {
  const supabase = await createClient();

  // .limit(1) + array access rather than .maybeSingle(), which throws if
  // more than one row ever matches — defensive against the global-default
  // row (studio_id IS NULL) not being uniqueness-constrained at the DB
  // level (Postgres treats NULLs as distinct in a unique index).
  const { data: studioRows } = await supabase
    .from("revenue_leak_assumptions")
    .select("*")
    .eq("studio_id", studioId)
    .limit(1);

  if (studioRows && studioRows.length > 0) {
    return { assumptions: rowToAssumptions(studioRows[0]), source: "studio" };
  }

  const { data: globalRows } = await supabase
    .from("revenue_leak_assumptions")
    .select("*")
    .is("studio_id", null)
    .limit(1);

  if (globalRows && globalRows.length > 0) {
    return { assumptions: rowToAssumptions(globalRows[0]), source: "global" };
  }

  return { assumptions: DEFAULT_ASSUMPTIONS, source: "default" };
}
