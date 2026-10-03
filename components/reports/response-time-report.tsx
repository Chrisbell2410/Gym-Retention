"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Printer } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { saveRevenueLeakAssumptions } from "@/lib/actions/revenue-leak";
import { calculateRevenueLeak } from "@/lib/revenue-leak";
import type { RevenueLeakAssumptions } from "@/lib/revenue-leak";
import { computeChannelStats, formatDuration } from "@/lib/secret-shop-stats";
import type { LogForStats } from "@/lib/secret-shop-stats";
import {
  CATEGORY_LABELS,
  NEIGHBORHOOD_LABELS,
  SECRET_SHOP_CHANNEL_LABELS,
} from "@/lib/labels";
import type { AssumptionsSource } from "@/lib/revenue-leak-data";
import type { Database } from "@/types/supabase";

type Studio = Database["public"]["Tables"]["studios"]["Row"];

const INITIAL_STATE = { error: null, success: false };

const ASSUMPTION_FIELDS: {
  key: keyof RevenueLeakAssumptions;
  name: string;
  label: string;
  suffix?: string;
  step?: string;
}[] = [
  { key: "leadsPerMonth", name: "leads_per_month", label: "Inbound leads per month" },
  {
    key: "closeRateWithFastResponse",
    name: "close_rate_with_fast_response",
    label: "Close rate with a fast response",
    suffix: "%",
    step: "1",
  },
  {
    key: "closeRateWithActualResponse",
    name: "close_rate_with_actual_response",
    label: "Close rate at their actual response time",
    suffix: "%",
    step: "1",
  },
  {
    key: "monthlyMembershipPrice",
    name: "monthly_membership_price",
    label: "Monthly membership price",
    suffix: "$",
  },
  {
    key: "avgMonthsRetained",
    name: "avg_months_retained",
    label: "Average months retained",
  },
];

const SOURCE_LABELS: Record<AssumptionsSource, string> = {
  studio: "Customized for this studio",
  global: "Your Charleston-wide defaults",
  default: "Starting defaults — not yet customized",
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="print:hidden rounded-md bg-spark-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-spark-600 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save assumptions"}
    </button>
  );
}

function money(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function ResponseTimeReport({
  studio,
  studioLogs,
  allLogs,
  initialAssumptions,
  assumptionsSource,
}: {
  studio: Studio;
  studioLogs: LogForStats[];
  allLogs: LogForStats[];
  initialAssumptions: RevenueLeakAssumptions;
  assumptionsSource: AssumptionsSource;
}) {
  const [state, formAction] = useActionState(
    saveRevenueLeakAssumptions.bind(null, studio.id),
    INITIAL_STATE,
  );
  const [assumptions, setAssumptions] =
    useState<RevenueLeakAssumptions>(initialAssumptions);

  const studioStats = computeChannelStats(studioLogs);
  const charlestonStats = computeChannelStats(allLogs);
  const result = calculateRevenueLeak(assumptions);
  // Once a save succeeds this is definitely a per-studio override now,
  // even though the `assumptionsSource` prop won't reflect that until the
  // page is next reloaded.
  const displaySource = state.success ? "studio" : assumptionsSource;

  function updateField(key: keyof RevenueLeakAssumptions, raw: string) {
    const n = Number(raw);
    setAssumptions((prev) => ({
      ...prev,
      [key]: Number.isNaN(n) ? 0 : key.startsWith("closeRate") ? n / 100 : n,
    }));
  }

  function fieldValue(key: keyof RevenueLeakAssumptions): string {
    const v = assumptions[key];
    return key.startsWith("closeRate") ? String(Math.round(v * 100)) : String(v);
  }

  const channelsWithData = studioStats.filter((s) => s.total > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/prospects" className="text-sm text-ink-400 hover:text-ink-700">
          ← Back to Prospects
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          <Printer size={15} />
          Print / Save as PDF
        </button>
      </div>

      <div className="rounded-xl border border-surface-border bg-white p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between border-b border-surface-border pb-6">
          <div>
            <Logo size={26} />
            <h1 className="font-display mt-3 text-xl font-bold text-ink-900">
              Response Time Report
            </h1>
            <p className="text-sm text-ink-400">
              Generated {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-bold text-ink-900">
              {studio.name}
            </div>
            <div className="text-sm text-ink-400">
              {[
                studio.category ? CATEGORY_LABELS[studio.category] : null,
                studio.neighborhood ? NEIGHBORHOOD_LABELS[studio.neighborhood] : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        </div>

        {channelsWithData.length === 0 ? (
          <div className="rounded-md bg-ink-50 p-6 text-center">
            <p className="text-sm text-ink-600">
              {studio.name} hasn&apos;t been secret-shopped yet — there&apos;s
              nothing to report until there&apos;s real data to show them.
            </p>
            <Link
              href="/secret-shop"
              className="mt-3 inline-block text-sm font-medium text-spark-600 hover:text-spark-700"
            >
              Log a secret-shop inquiry →
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="mb-3 text-xs font-semibold tracking-wider text-ink-400 uppercase">
                Response time by channel
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-left text-xs font-semibold tracking-wider text-ink-400 uppercase">
                    <th className="py-2">Channel</th>
                    <th className="py-2">{studio.name}</th>
                    <th className="py-2">Charleston median</th>
                    <th className="py-2">Fastest we&apos;ve seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {channelsWithData.map((s) => {
                    const charleston = charlestonStats.find(
                      (c) => c.channel === s.channel,
                    );
                    const studioDisplay =
                      s.medianHours !== null
                        ? formatDuration(s.medianHours)
                        : s.resolved > 0
                          ? "No reply"
                          : "Awaiting reply";
                    const isSlower =
                      s.medianHours !== null &&
                      charleston?.medianHours != null &&
                      s.medianHours > charleston.medianHours;
                    return (
                      <tr key={s.channel}>
                        <td className="py-2.5 text-ink-700">
                          {SECRET_SHOP_CHANNEL_LABELS[s.channel] ?? s.channel}
                        </td>
                        <td
                          className={`py-2.5 font-medium ${isSlower ? "text-spark-600" : "text-ink-900"}`}
                        >
                          {studioDisplay}
                        </td>
                        <td className="py-2.5 text-ink-600">
                          {charleston ? formatDuration(charleston.medianHours) : "—"}
                        </td>
                        <td className="py-2.5 text-harbor-600">
                          {charleston ? formatDuration(charleston.fastestHours) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-ink-300">
                &quot;Charleston median&quot; and &quot;fastest we&apos;ve seen&quot;
                are drawn from every secret-shop inquiry logged across all
                studios, not just this one.
              </p>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-ink-400 uppercase">
                  Estimated monthly revenue leak
                </h2>
                <span className="text-xs text-ink-300 print:hidden">
                  {SOURCE_LABELS[displaySource]}
                </span>
              </div>

              <form
                action={formAction}
                className="mb-4 grid grid-cols-2 gap-3 print:hidden"
              >
                {ASSUMPTION_FIELDS.map((f) => (
                  <div key={f.name}>
                    <label className="mb-1 block text-xs font-medium text-ink-500">
                      {f.label}
                    </label>
                    <div className="flex items-center gap-1">
                      {f.suffix === "$" && <span className="text-ink-400">$</span>}
                      <input
                        type="number"
                        name={f.name}
                        min="0"
                        step={f.step ?? "0.01"}
                        value={fieldValue(f.key)}
                        onChange={(e) => updateField(f.key, e.target.value)}
                        className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
                      />
                      {f.suffix === "%" && <span className="text-ink-400">%</span>}
                    </div>
                  </div>
                ))}
                <div className="col-span-2 flex items-center justify-between pt-1">
                  {state.error && (
                    <p className="text-sm text-red-600">{state.error}</p>
                  )}
                  {state.success && (
                    <p className="text-sm text-harbor-600">Saved.</p>
                  )}
                  <div className="ml-auto">
                    <SaveButton />
                  </div>
                </div>
              </form>

              {/* Static version of the same assumptions for print — no
                  input chrome, just the numbers that produced the result
                  below, so the printed report shows its work. */}
              <dl className="mb-4 hidden grid-cols-2 gap-x-6 gap-y-1 text-sm print:grid">
                {ASSUMPTION_FIELDS.map((f) => (
                  <div key={f.name} className="flex justify-between border-b border-surface-border py-1">
                    <dt className="text-ink-500">{f.label}</dt>
                    <dd className="font-medium text-ink-900">
                      {f.suffix === "$"
                        ? money(assumptions[f.key])
                        : f.suffix === "%"
                          ? `${Math.round(assumptions[f.key] * 100)}%`
                          : assumptions[f.key]}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="rounded-lg bg-ink-900 p-5 text-white print:bg-white print:border print:border-ink-900 print:text-ink-900">
                <div className="font-display text-3xl font-bold text-spark-400 print:text-spark-600">
                  {money(result.monthlyRevenueLeak)}
                  <span className="text-base font-normal text-ink-300 print:text-ink-500"> / month</span>
                </div>
                <p className="mt-1 text-sm text-ink-300 print:text-ink-600">
                  Estimated {result.additionalMembersPerMonthIfFast.toFixed(1)}{" "}
                  more members/month at a fast-response close rate vs. their
                  actual rate, over {assumptions.avgMonthsRetained} months of
                  average retention that&apos;s roughly{" "}
                  <strong className="text-white print:text-ink-900">
                    {money(result.lifetimeValueLeakPerMonthCohort)}
                  </strong>{" "}
                  in lifetime value per month of leads lost to slow response.
                </p>
              </div>
              <p className="mt-2 text-xs text-ink-300">
                These are estimates built from the assumptions above, not
                measured outcomes — edit any number to match what {studio.name}{" "}
                actually sees.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
