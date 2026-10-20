"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { seedDemoStudio, seedBtoneDemoStudio } from "@/lib/actions/demo";

type Existing = { studioId: string; studioConfigId: string | null } | null;
type Result = { studioId: string; studioConfigId: string | null; alreadyExisted: boolean };

function DemoCard({
  title,
  description,
  existing,
  onSeed,
}: {
  title: string;
  description: string;
  existing: Existing;
  onSeed: () => Promise<{ error: string | null; studioId: string | null; studioConfigId: string | null; alreadyExisted: boolean }>;
}) {
  const [result, setResult] = useState<Result | null>(existing ? { ...existing, alreadyExisted: true } : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    const res = await onSeed();
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult({ studioId: res.studioId!, studioConfigId: res.studioConfigId, alreadyExisted: res.alreadyExisted });
  }

  return (
    <div className="rounded-lg border border-surface-border bg-white p-4">
      <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-400">{description}</p>

      {!result && (
        <button
          onClick={handleSeed}
          disabled={loading}
          className="mt-3 flex items-center gap-2 rounded-md bg-spark-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-spark-600 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {loading ? "Setting up…" : "Set up this demo studio"}
        </button>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {result && (
        <div className="mt-3 space-y-2 border-t border-surface-border pt-3 text-sm">
          <p className="text-ink-700">
            {result.alreadyExisted ? "Already set up." : "Created."} Here&apos;s where to show it off:
          </p>
          <div className="flex flex-col gap-1.5">
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
            <a
              href={`/studio-dashboard/${result.studioId}`}
              className="flex items-center gap-1.5 font-medium text-spark-600 hover:text-spark-700"
            >
              View its dashboard <ArrowRight size={14} />
            </a>
            {result.studioConfigId && (
              <a
                href={`/chat/${result.studioConfigId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-medium text-spark-600 hover:text-spark-700"
              >
                Open the standalone chat link <ArrowRight size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DemoSetupClient({
  existingGeneric,
  existingBtone,
}: {
  existingGeneric: Existing;
  existingBtone: Existing;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          Demo Mode
        </h1>
        <p className="text-sm text-ink-400">
          One click sets up a fully-configured demo studio with sample
          conversation history, so the test console / widget preview /
          dashboard all have something real to show instead of an empty
          state.
        </p>
      </div>

      <DemoCard
        title="Generic demo studio"
        description={'"Lowcountry Pilates & Yoga" — entirely fake name/address/contact, safe to show any prospect.'}
        existing={existingGeneric}
        onSeed={seedDemoStudio}
      />

      <DemoCard
        title="btone FITNESS — James Island"
        description="Class format, pricing, and policy copy pulled from btone's own public website for the James Island pre-opening location. Rehearsal aid for the meeting with btone specifically — don't show this one to other prospects."
        existing={existingBtone}
        onSeed={seedBtoneDemoStudio}
      />
    </div>
  );
}
