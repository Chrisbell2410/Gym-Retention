"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { seedDemoStudio } from "@/lib/actions/demo";

export function DemoSetupClient({
  existing,
}: {
  existing: { studioId: string; studioConfigId: string | null } | null;
}) {
  const [result, setResult] = useState(existing ? { ...existing, alreadyExisted: true } : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    const res = await seedDemoStudio();
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult({ studioId: res.studioId!, studioConfigId: res.studioConfigId, alreadyExisted: res.alreadyExisted });
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          Demo Mode
        </h1>
        <p className="text-sm text-ink-400">
          Sets up one fully-configured, entirely fake studio —
          &quot;Lowcountry Pilates &amp; Yoga&quot; — with a realistic
          schedule, pricing, FAQs, and a few sample conversations already in
          its history. Safe to show in a pitch meeting; nothing here is a
          real prospect or customer.
        </p>
      </div>

      {!result && (
        <button
          onClick={handleSeed}
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-spark-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-spark-600 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {loading ? "Setting up…" : "Set up demo studio"}
        </button>
      )}

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {result && (
        <div className="space-y-3 rounded-lg border border-surface-border bg-white p-4">
          <p className="text-sm text-ink-700">
            {result.alreadyExisted
              ? "The demo studio is already set up."
              : "Demo studio created."}{" "}
            Here&apos;s where to show it off:
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href="/agent-test"
              className="flex items-center gap-1.5 font-medium text-spark-600 hover:text-spark-700"
            >
              Try it in the Agent Test Console <ArrowRight size={14} />
            </a>
            <a
              href="/widget-preview"
              className="flex items-center gap-1.5 font-medium text-spark-600 hover:text-spark-700"
            >
              See the live chat widget <ArrowRight size={14} />
            </a>
            {result.studioId && (
              <>
                <a
                  href={`/studio-dashboard/${result.studioId}`}
                  className="flex items-center gap-1.5 font-medium text-spark-600 hover:text-spark-700"
                >
                  View its dashboard <ArrowRight size={14} />
                </a>
                <a
                  href="/pipeline"
                  className="flex items-center gap-1.5 font-medium text-spark-600 hover:text-spark-700"
                >
                  View it on the Pipeline board <ArrowRight size={14} />
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
