"use client";

import { useMemo, useState } from "react";
import { Plus, Upload, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABELS,
  NEIGHBORHOOD_LABELS,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_BADGE_CLASSES,
  BOOKING_PLATFORM_LABELS,
} from "@/lib/labels";
import { StudioFormDialog } from "@/components/studios/studio-form-dialog";
import { CsvImportDialog } from "@/components/prospects/csv-import-dialog";
import { PlacesSyncDialog } from "@/components/prospects/places-sync-dialog";
import type { Database } from "@/types/supabase";

type Studio = Database["public"]["Tables"]["studios"]["Row"];

const selectClass =
  "rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-700 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none";

export function ProspectsTable({ studios }: { studios: Studio[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [stage, setStage] = useState("");
  const [showFranchises, setShowFranchises] = useState(false);

  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInstance, setFormInstance] = useState(0);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvInstance, setCsvInstance] = useState(0);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncInstance, setSyncInstance] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return studios.filter((s) => {
      if (!showFranchises && s.is_franchise) return false;
      if (category && s.category !== category) return false;
      if (neighborhood && s.neighborhood !== neighborhood) return false;
      if (stage && s.pipeline_stage !== stage) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [studios, search, category, neighborhood, stage, showFranchises]);

  const franchiseCount = studios.filter((s) => s.is_franchise).length;

  function openAdd() {
    setEditingStudio(null);
    setFormInstance((i) => i + 1);
    setFormOpen(true);
  }
  function openEdit(studio: Studio) {
    setEditingStudio(studio);
    setFormInstance((i) => i + 1);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Prospects
          </h1>
          <p className="text-sm text-ink-400">
            {studios.length} studio{studios.length === 1 ? "" : "s"} total
            {franchiseCount > 0 && ` · ${franchiseCount} franchise${franchiseCount === 1 ? "" : "s"} hidden by default`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSyncInstance((i) => i + 1);
              setSyncOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Sparkles size={15} />
            Sync from Places
          </button>
          <button
            onClick={() => {
              setCsvInstance((i) => i + 1);
              setCsvOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Upload size={15} />
            Import CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-md bg-spark-500 px-3 py-2 text-sm font-medium text-white hover:bg-spark-600"
          >
            <Plus size={15} />
            Add studio
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-border bg-white p-3">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 rounded-md border border-ink-200 px-2.5 py-1.5 text-sm focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={selectClass}>
          <option value="">All neighborhoods</option>
          {Object.entries(NEIGHBORHOOD_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectClass}>
          <option value="">All stages</option>
          {Object.entries(PIPELINE_STAGE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <label className="ml-auto flex items-center gap-1.5 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={showFranchises}
            onChange={(e) => setShowFranchises(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-spark-500 focus:ring-spark-500"
          />
          Show franchises
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs font-semibold tracking-wider text-ink-400 uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Neighborhood</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Booking platform</th>
              <th className="px-4 py-3">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-300">
                  {studios.length === 0
                    ? "No studios yet — add one, import a CSV, or sync from Google Places."
                    : "No studios match these filters."}
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openEdit(s)}
                  className="cursor-pointer hover:bg-surface"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{s.name}</div>
                    {s.is_franchise && (
                      <Badge className="mt-1 bg-spark-50 text-spark-700">
                        {s.franchise_brand ?? "Franchise"}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {s.category ? CATEGORY_LABELS[s.category] : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {s.neighborhood ? NEIGHBORHOOD_LABELS[s.neighborhood] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={PIPELINE_STAGE_BADGE_CLASSES[s.pipeline_stage]}>
                      {PIPELINE_STAGE_LABELS[s.pipeline_stage] ?? s.pipeline_stage}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {s.booking_platform ? BOOKING_PLATFORM_LABELS[s.booking_platform] : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {s.rating ? `${s.rating}★ (${s.review_count ?? 0})` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <StudioFormDialog
        key={formInstance}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        studio={editingStudio}
      />
      <CsvImportDialog
        key={csvInstance}
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
      />
      <PlacesSyncDialog
        key={syncInstance}
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
      />
    </div>
  );
}
