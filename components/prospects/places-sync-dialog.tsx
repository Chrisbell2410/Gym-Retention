"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { syncFromGooglePlaces } from "@/lib/actions/studios";
import type { PlacesSyncResult } from "@/lib/actions/studios";
import {
  CHARLESTON_NEIGHBORHOODS,
  STUDIO_CATEGORIES,
} from "@/lib/providers/places/constants";

/** NOTE: the parent must remount this on every open (key={syncInstance}) so
 * selections/results don't carry over from the previous open — see
 * studio-form-dialog.tsx. */
export function PlacesSyncDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [neighborhoods, setNeighborhoods] = useState<string[]>(
    CHARLESTON_NEIGHBORHOODS.map((n) => n.dbValue),
  );
  const [categories, setCategories] = useState<string[]>(
    STUDIO_CATEGORIES.map((c) => c.dbValue),
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PlacesSyncResult | null>(null);

  // Mirrors the query-building logic in lib/actions/studios.ts so the
  // "N requests" estimate shown here matches what will actually run.
  const queryCount = CHARLESTON_NEIGHBORHOODS.filter((n) =>
    neighborhoods.includes(n.dbValue),
  ).reduce(
    (sum, n) =>
      sum +
      n.queries.length *
        STUDIO_CATEGORIES.filter((c) => categories.includes(c.dbValue)).length,
    0,
  );

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  async function handleRun() {
    setRunning(true);
    setResult(null);
    const res = await syncFromGooglePlaces(neighborhoods, categories);
    setResult(res);
    setRunning(false);
    if (res.added > 0) router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sync from Google Places"
      widthClassName="max-w-xl"
    >
      <div className="space-y-5">
        <p className="text-sm text-ink-500">
          Each neighborhood × category combination is one paid Google Places
          request. Re-running only adds studios it hasn&apos;t seen before
          (matched by place ID) — it never overwrites anything you&apos;ve
          already edited.
        </p>

        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
            Neighborhoods
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {CHARLESTON_NEIGHBORHOODS.map((n) => (
              <label key={n.dbValue} className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={neighborhoods.includes(n.dbValue)}
                  onChange={() => toggle(neighborhoods, setNeighborhoods, n.dbValue)}
                  className="h-4 w-4 rounded border-ink-300 text-spark-500 focus:ring-spark-500"
                />
                {n.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
            Categories
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {STUDIO_CATEGORIES.map((c) => (
              <label key={c.dbValue} className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={categories.includes(c.dbValue)}
                  onChange={() => toggle(categories, setCategories, c.dbValue)}
                  className="h-4 w-4 rounded border-ink-300 text-spark-500 focus:ring-spark-500"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        {result && (
          <div
            className={`rounded-md p-3 text-sm ${result.error ? "bg-red-50 text-red-700" : "bg-harbor-50 text-harbor-800"}`}
          >
            {result.error && <p>{result.error}</p>}
            {!result.error && (
              <p>
                Added {result.added} new studio{result.added === 1 ? "" : "s"}.{" "}
                {result.skippedExisting > 0 &&
                  `${result.skippedExisting} already in your list. `}
                {result.skippedFranchise > 0 &&
                  `${result.skippedFranchise} flagged as franchises.`}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-surface-border pt-4">
          <span className="text-xs text-ink-400">
            {queryCount} request{queryCount === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={running || queryCount === 0}
              className="rounded-md bg-spark-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-spark-600 disabled:opacity-50"
            >
              {running ? "Searching…" : "Run sync"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
