/**
 * Estimated monthly revenue leak from slow lead response, for the
 * Response Time Report (Phase 1, item 4). Every assumption here is a
 * number Chris can edit per-studio or globally (see
 * `revenue_leak_assumptions` table) — this file just holds the math and
 * sane defaults, and documents the formula so the report never makes a
 * claim it can't show its work for.
 */

export interface RevenueLeakAssumptions {
  /** New inbound leads per month (web form + DM + phone + email, combined). */
  leadsPerMonth: number;
  /** Fraction of leads that become paying members under GOOD response times. */
  closeRateWithFastResponse: number;
  /** Fraction of leads that become paying members under the studio's ACTUAL response times. */
  closeRateWithActualResponse: number;
  monthlyMembershipPrice: number;
  avgMonthsRetained: number;
}

/** Charleston-wide defaults until a studio gives Chris real numbers. */
export const DEFAULT_ASSUMPTIONS: RevenueLeakAssumptions = {
  leadsPerMonth: 30,
  closeRateWithFastResponse: 0.35,
  closeRateWithActualResponse: 0.2,
  monthlyMembershipPrice: 150,
  avgMonthsRetained: 8,
};

export interface RevenueLeakResult {
  additionalMembersPerMonthIfFast: number;
  monthlyRevenueLeak: number;
  lifetimeValueLeakPerMonthCohort: number;
}

export function calculateRevenueLeak(
  a: RevenueLeakAssumptions = DEFAULT_ASSUMPTIONS,
): RevenueLeakResult {
  const additionalMembersPerMonthIfFast =
    a.leadsPerMonth *
    (a.closeRateWithFastResponse - a.closeRateWithActualResponse);

  const monthlyRevenueLeak =
    additionalMembersPerMonthIfFast * a.monthlyMembershipPrice;

  const lifetimeValueLeakPerMonthCohort =
    monthlyRevenueLeak * a.avgMonthsRetained;

  return {
    additionalMembersPerMonthIfFast,
    monthlyRevenueLeak,
    lifetimeValueLeakPerMonthCohort,
  };
}
