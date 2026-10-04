"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

const inputClass =
  "w-full rounded-md border border-ink-200 px-2 py-1.5 text-sm text-ink-900 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none";

/**
 * Repeatable-row editor for a studio_configs jsonb array column (schedule,
 * pricing, faqs). Serializes to a hidden JSON input on every change so it
 * drops straight into a normal `<form action={...}>` — the server action
 * parses it back out (see lib/validation/studio-config.ts's
 * jsonArrayField).
 */
export function JsonListEditor({
  name,
  label,
  fields,
  initialRows,
  addLabel,
}: {
  name: string;
  label: string;
  fields: FieldDef[];
  initialRows: Record<string, string | number>[];
  addLabel: string;
}) {
  const [rows, setRows] = useState<Record<string, string | number>[]>(
    initialRows,
  );

  function updateRow(i: number, key: string, value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)),
    );
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      Object.fromEntries(fields.map((f) => [f.key, ""])),
    ]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-500">
        {label}
      </label>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {fields.map((f) =>
              f.type === "select" ? (
                <select
                  key={f.key}
                  value={row[f.key] ?? ""}
                  onChange={(e) => updateRow(i, f.key, e.target.value)}
                  className={inputClass}
                >
                  <option value="">{f.label}</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  key={f.key}
                  type={f.type ?? "text"}
                  value={row[f.key] ?? ""}
                  onChange={(e) => updateRow(i, f.key, e.target.value)}
                  placeholder={f.placeholder ?? f.label}
                  className={inputClass}
                />
              ),
            )}
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove row"
              className="shrink-0 rounded p-1 text-ink-300 hover:bg-ink-100 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 flex items-center gap-1 text-xs font-medium text-harbor-600 hover:text-harbor-700"
      >
        <Plus size={13} />
        {addLabel}
      </button>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
    </div>
  );
}
