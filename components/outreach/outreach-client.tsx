"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateDraftsForStudio } from "@/lib/actions/outreach";
import { DraftDialog } from "@/components/outreach/draft-dialog";
import type { Database } from "@/types/supabase";

type OutreachDraft = Database["public"]["Tables"]["outreach_drafts"]["Row"];

export interface DraftWithStudio extends OutreachDraft {
  studios: { name: string; email: string | null } | null;
}

const SEQUENCE_STEP_LABELS: Record<number, string> = {
  0: "Initial email",
  3: "Day 3 follow-up",
  7: "Day 7 follow-up",
  14: "Day 14 follow-up",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "bg-ink-100 text-ink-500",
  approved: "bg-harbor-100 text-harbor-700",
  sent: "bg-spark-100 text-spark-700",
  skipped: "bg-ink-100 text-ink-300",
};

export function OutreachClient({
  drafts,
  eligibleStudios,
  sentToday,
  dailyCap,
  isLiveSending,
}: {
  drafts: DraftWithStudio[];
  eligibleStudios: { id: string; name: string }[];
  sentToday: number;
  dailyCap: number;
  isLiveSending: boolean;
}) {
  const [selectedStudioId, setSelectedStudioId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [editingDraft, setEditingDraft] = useState<DraftWithStudio | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInstance, setDialogInstance] = useState(0);

  const groups = useMemo(() => {
    const byStudio = new Map<string, DraftWithStudio[]>();
    for (const d of drafts) {
      const list = byStudio.get(d.studio_id) ?? [];
      list.push(d);
      byStudio.set(d.studio_id, list);
    }
    return Array.from(byStudio.values());
  }, [drafts]);

  async function handleGenerate() {
    if (!selectedStudioId) return;
    setGenerating(true);
    setGenerateError(null);
    const result = await generateDraftsForStudio(selectedStudioId);
    setGenerating(false);
    if (result.error) {
      setGenerateError(result.error);
      return;
    }
    setSelectedStudioId("");
  }

  function openDraft(draft: DraftWithStudio) {
    setEditingDraft(draft);
    setDialogInstance((i) => i + 1);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Outreach
          </h1>
          <p className="text-sm text-ink-400">
            {sentToday} / {dailyCap} sent today. Nothing sends without your
            approval.
          </p>
        </div>
      </div>

      {!isLiveSending && (
        <div className="rounded-md bg-ink-900 px-4 py-3 text-sm text-white">
          <span className="font-medium text-spark-400">Test mode:</span>{" "}
          Resend isn&apos;t configured yet, so &quot;Send now&quot; logs a
          fake send instead of emailing anyone for real. Set{" "}
          <code className="text-xs text-ink-200">RESEND_API_KEY</code> and{" "}
          <code className="text-xs text-ink-200">OUTREACH_FROM_EMAIL</code>{" "}
          in <code className="text-xs text-ink-200">.env.local</code> once
          your sending domain is verified.
        </div>
      )}

      <div className="rounded-lg border border-surface-border bg-white p-4">
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Generate a draft sequence
        </h2>
        {eligibleStudios.length === 0 ? (
          <p className="text-sm text-ink-400">
            No studios ready yet — secret-shop a studio first (and make sure
            it doesn&apos;t already have drafts).
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStudioId}
              onChange={(e) => setSelectedStudioId(e.target.value)}
              className="rounded-md border border-ink-200 bg-white px-2.5 py-2 text-sm text-ink-700 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
            >
              <option value="">Choose a studio…</option>
              {eligibleStudios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={!selectedStudioId || generating}
              className="flex items-center gap-1.5 rounded-md bg-spark-500 px-3 py-2 text-sm font-medium text-white hover:bg-spark-600 disabled:opacity-50"
            >
              <Sparkles size={15} />
              {generating ? "Drafting…" : "Generate 4-email sequence"}
            </button>
          </div>
        )}
        {generateError && (
          <p className="mt-2 text-sm text-red-600">{generateError}</p>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-surface-border bg-white p-6 text-center text-sm text-ink-300">
          No outreach drafts yet.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group[0].studio_id}
              className="rounded-lg border border-surface-border bg-white p-4"
            >
              <h3 className="mb-3 font-medium text-ink-900">
                {group[0].studios?.name ?? "Unknown studio"}
                {!group[0].studios?.email && (
                  <span className="ml-2 text-xs font-normal text-spark-600">
                    No email on file
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {group
                  .sort((a, b) => a.sequence_step - b.sequence_step)
                  .map((draft) => (
                    <button
                      key={draft.id}
                      onClick={() => openDraft(draft)}
                      className="rounded-md border border-surface-border p-3 text-left hover:bg-surface"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-ink-500">
                          {SEQUENCE_STEP_LABELS[draft.sequence_step] ??
                            `Step ${draft.sequence_step}`}
                        </span>
                        <Badge className={STATUS_BADGE_CLASSES[draft.status]}>
                          {draft.status}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-ink-700">
                        {draft.subject}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DraftDialog
        key={dialogInstance}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        draft={editingDraft}
      />
    </div>
  );
}
