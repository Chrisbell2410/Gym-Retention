"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StudioFormDialog } from "@/components/studios/studio-form-dialog";
import { changeStudioStage } from "@/lib/actions/pipeline-activities";
import {
  CATEGORY_LABELS,
  PIPELINE_STAGE_LABELS,
  SEQUENTIAL_PIPELINE_STAGES,
} from "@/lib/labels";
import type { Database } from "@/types/supabase";

type Studio = Database["public"]["Tables"]["studios"]["Row"];

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr <= today;
}

function StudioCard({
  studio,
  onOpen,
  busy,
  onMove,
}: {
  studio: Studio;
  onOpen: () => void;
  busy: boolean;
  onMove: (direction: "back" | "forward") => void;
}) {
  const stageIndex = SEQUENTIAL_PIPELINE_STAGES.indexOf(studio.pipeline_stage);
  const canMoveBack = stageIndex > 0;
  const canMoveForward =
    stageIndex >= 0 && stageIndex < SEQUENTIAL_PIPELINE_STAGES.length - 1;

  return (
    <div className="rounded-lg border border-surface-border bg-white p-3 shadow-sm">
      <button
        onClick={onOpen}
        className="block w-full text-left"
      >
        <div className="font-medium text-ink-900">{studio.name}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {studio.category && (
            <Badge className="bg-ink-100 text-ink-500">
              {CATEGORY_LABELS[studio.category] ?? studio.category}
            </Badge>
          )}
        </div>
        {studio.next_action && (
          <div
            className={`mt-2 text-xs ${isOverdue(studio.next_action_date) ? "font-medium text-spark-600" : "text-ink-400"}`}
          >
            {studio.next_action}
            {studio.next_action_date && ` · ${studio.next_action_date}`}
          </div>
        )}
      </button>
      {(canMoveBack || canMoveForward) && (
        <div className="mt-2 flex justify-between border-t border-surface-border pt-2">
          <button
            onClick={() => onMove("back")}
            disabled={!canMoveBack || busy}
            aria-label="Move to previous stage"
            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:invisible"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onMove("forward")}
            disabled={!canMoveForward || busy}
            aria-label="Move to next stage"
            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:invisible"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function KanbanBoard({ studios }: { studios: Studio[] }) {
  const router = useRouter();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInstance, setFormInstance] = useState(0);

  const columns = useMemo(() => {
    const byStage = new Map<string, Studio[]>();
    for (const stage of Object.keys(PIPELINE_STAGE_LABELS)) {
      byStage.set(stage, []);
    }
    for (const s of studios) {
      const list = byStage.get(s.pipeline_stage) ?? [];
      list.push(s);
      byStage.set(s.pipeline_stage, list);
    }
    return byStage;
  }, [studios]);

  function openEdit(studio: Studio) {
    setEditingStudio(studio);
    setFormInstance((i) => i + 1);
    setFormOpen(true);
  }

  async function handleMove(studio: Studio, direction: "back" | "forward") {
    const stageIndex = SEQUENTIAL_PIPELINE_STAGES.indexOf(studio.pipeline_stage);
    const targetIndex = direction === "forward" ? stageIndex + 1 : stageIndex - 1;
    const target = SEQUENTIAL_PIPELINE_STAGES[targetIndex];
    if (!target) return;

    setMovingId(studio.id);
    const result = await changeStudioStage(studio.id, target);
    setMovingId(null);
    if (result.error) {
      alert(`Couldn't move ${studio.name}: ${result.error}`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          Pipeline
        </h1>
        <p className="text-sm text-ink-400">
          {studios.length} studio{studios.length === 1 ? "" : "s"} in the
          pipeline. Click a card for full details and activity history; use
          the arrows to move it a stage at a time.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {Object.entries(PIPELINE_STAGE_LABELS).map(([stage, label]) => {
          const stageStudios = columns.get(stage) ?? [];
          return (
            <div key={stage} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold tracking-wider text-ink-400 uppercase">
                  {label}
                </h2>
                <span className="text-xs text-ink-300">
                  {stageStudios.length}
                </span>
              </div>
              <div className="flex min-h-[4rem] flex-col gap-2 rounded-lg bg-ink-50 p-2">
                {stageStudios.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-ink-300">Empty</p>
                ) : (
                  stageStudios.map((s) => (
                    <StudioCard
                      key={s.id}
                      studio={s}
                      busy={movingId === s.id}
                      onOpen={() => openEdit(s)}
                      onMove={(direction) => handleMove(s, direction)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <StudioFormDialog
        key={formInstance}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        studio={editingStudio}
      />
    </div>
  );
}
