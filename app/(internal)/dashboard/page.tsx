import { createClient } from "@/lib/supabase/server";

const STAGE_LABELS: Record<string, string> = {
  researched: "Researched",
  secret_shopped: "Secret-Shopped",
  contacted: "Contacted",
  meeting_booked: "Meeting Booked",
  pilot: "Pilot",
  paying: "Paying",
  lost: "Lost",
};

// Stages worth visually celebrating get the brand accent; "lost" is muted
// rather than alarming (red), since a dead lead isn't an error state.
const STAGE_ACCENT: Record<string, string> = {
  pilot: "text-harbor-600",
  paying: "text-spark-600",
  lost: "text-ink-300",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: studios, error: studiosError }, { data: todaysActions }] =
    await Promise.all([
      supabase.from("studios").select("pipeline_stage"),
      supabase
        .from("studios")
        .select("id, name, next_action, next_action_date")
        .lte("next_action_date", new Date().toISOString().slice(0, 10))
        .not("next_action_date", "is", null)
        .order("next_action_date", { ascending: true }),
    ]);

  const stageCounts = (studios ?? []).reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.pipeline_stage] = (acc[s.pipeline_stage] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          Dashboard
        </h1>
        <p className="text-sm text-ink-400">
          Pipeline overview and today&apos;s actions.
        </p>
      </div>

      {studiosError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Couldn&apos;t load studios: {studiosError.message}. If this is your
          first run, make sure the Phase 1 migration has been applied — see
          README.md &quot;Supabase setup&quot;.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Pipeline by stage
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <div
              key={key}
              className="rounded-lg border border-surface-border bg-white p-4"
            >
              <div
                className={`font-display text-2xl font-bold ${STAGE_ACCENT[key] ?? "text-ink-900"}`}
              >
                {stageCounts[key] ?? 0}
              </div>
              <div className="text-xs text-ink-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Today&apos;s actions
        </h2>
        {!todaysActions || todaysActions.length === 0 ? (
          <p className="text-sm text-ink-300">Nothing due today. Nice.</p>
        ) : (
          <ul className="divide-y divide-surface-border rounded-lg border border-surface-border bg-white">
            {todaysActions.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-ink-900">{s.name}</div>
                  <div className="text-sm text-ink-400">{s.next_action}</div>
                </div>
                <div className="text-xs text-ink-300">
                  {s.next_action_date}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
