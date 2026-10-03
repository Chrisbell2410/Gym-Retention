"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Modal } from "@/components/ui/modal";
import { importStudiosFromCsv } from "@/lib/actions/studios";
import type { CsvImportResult } from "@/lib/actions/studios";

const INITIAL_STATE: CsvImportResult = {
  error: null,
  inserted: 0,
  skipped: 0,
  skipReasons: [],
};

const TEMPLATE_HEADERS = [
  "name",
  "address",
  "neighborhood",
  "phone",
  "email",
  "website",
  "instagram_handle",
  "category",
  "notes",
];

function buildTemplateCsv() {
  return (
    TEMPLATE_HEADERS.join(",") +
    "\n" +
    "Example Studio Name,123 King St Charleston SC,downtown_peninsula,8435551234,hello@example.com,https://example.com,@example,pilates,\n"
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-spark-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-spark-600 disabled:opacity-50"
    >
      {pending ? "Importing…" : "Import"}
    </button>
  );
}

/** NOTE: the parent must remount this on every open (key={csvInstance}) to
 * reset useActionState between opens — see studio-form-dialog.tsx. */
export function CsvImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(
    importStudiosFromCsv,
    INITIAL_STATE,
  );

  function downloadTemplate() {
    const blob = new Blob([buildTemplateCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "studio-spark-prospects-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const didImport = state.inserted > 0 || state.skipped > 0;

  return (
    <Modal open={open} onClose={onClose} title="Import from CSV">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          Columns: <code className="text-xs">name</code> (required),{" "}
          <code className="text-xs">address</code>,{" "}
          <code className="text-xs">neighborhood</code>,{" "}
          <code className="text-xs">phone</code>,{" "}
          <code className="text-xs">email</code>,{" "}
          <code className="text-xs">website</code>,{" "}
          <code className="text-xs">instagram_handle</code>,{" "}
          <code className="text-xs">category</code>,{" "}
          <code className="text-xs">notes</code>. Franchise status is
          detected automatically unless you include an{" "}
          <code className="text-xs">is_franchise</code> column — btone is
          always excluded no matter what the file says.
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-sm font-medium text-harbor-600 hover:text-harbor-700"
        >
          Download a blank template
        </button>

        <form action={formAction} className="space-y-4">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-700 hover:file:bg-ink-200"
          />

          {state.error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </p>
          )}

          {didImport && !state.error && (
            <div className="rounded-md bg-harbor-50 p-3 text-sm text-harbor-800">
              Added {state.inserted} studio{state.inserted === 1 ? "" : "s"}.
              {state.skipped > 0 && ` Skipped ${state.skipped} row${state.skipped === 1 ? "" : "s"}.`}
              {state.skipReasons.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-harbor-700">
                  {state.skipReasons.slice(0, 10).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                  {state.skipReasons.length > 10 && (
                    <li>…and {state.skipReasons.length - 10} more</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
            >
              Close
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </Modal>
  );
}
