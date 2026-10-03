"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import {
  createSecretShopLog,
  deleteSecretShopLog,
  updateSecretShopLog,
} from "@/lib/actions/secret-shop-logs";
import type { LogActionState } from "@/lib/actions/secret-shop-logs";
import { SECRET_SHOP_CHANNEL_LABELS } from "@/lib/labels";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/datetime";
import type { Database } from "@/types/supabase";

type SecretShopLog = Database["public"]["Tables"]["secret_shop_logs"]["Row"];

const INITIAL_STATE: LogActionState = { error: null, success: false };

const inputClass =
  "w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-ink-500";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-spark-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-spark-600 disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/** A datetime-local input paired with a hidden ISO-string input — the
 * browser converts local-time-to-ISO on every change, so the server never
 * has to guess what timezone the input was entered in. */
function DateTimeField({
  label,
  name,
  defaultIso,
  required,
}: {
  label: string;
  name: string;
  defaultIso?: string | null;
  required?: boolean;
}) {
  const [local, setLocal] = useState(toDatetimeLocalValue(defaultIso));
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="datetime-local"
        value={local}
        required={required}
        onChange={(e) => setLocal(e.target.value)}
        className={inputClass}
      />
      <input type="hidden" name={name} value={fromDatetimeLocalValue(local)} />
    </div>
  );
}

export function LogFormDialog({
  open,
  onClose,
  log,
  studios,
  defaultStudioId,
}: {
  open: boolean;
  onClose: () => void;
  log?: SecretShopLog | null;
  studios: { id: string; name: string }[];
  defaultStudioId?: string;
}) {
  const isEdit = Boolean(log);
  const action = isEdit
    ? updateSecretShopLog.bind(null, log!.id)
    : createSecretShopLog;
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const closedRef = useRef(false);

  useEffect(() => {
    if (state.success && !closedRef.current) {
      closedRef.current = true;
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  async function handleDelete() {
    if (!log) return;
    if (!confirm("Delete this secret-shop log entry? This can't be undone."))
      return;
    setDeleting(true);
    const result = await deleteSecretShopLog(log.id);
    setDeleting(false);
    if (result.error) {
      alert(`Couldn't delete: ${result.error}`);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit secret-shop log" : "Log a secret-shop inquiry"}
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className={labelClass}>Studio *</label>
          <select
            name="studio_id"
            required
            defaultValue={log?.studio_id ?? defaultStudioId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Choose a studio…
            </option>
            {studios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Channel *</label>
          <select
            name="channel"
            required
            defaultValue={log?.channel ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Choose a channel…
            </option>
            {Object.entries(SECRET_SHOP_CHANNEL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DateTimeField
            label="Sent *"
            name="sent_at"
            defaultIso={log?.sent_at ?? new Date().toISOString()}
            required
          />
          <DateTimeField
            label="First reply (leave blank if none yet)"
            name="first_reply_at"
            defaultIso={log?.first_reply_at}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Reply quality</label>
            <select
              name="reply_quality"
              defaultValue={log?.reply_quality != null ? String(log.reply_quality) : ""}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="1">1 — Poor</option>
              <option value="2">2 — Below average</option>
              <option value="3">3 — Average</option>
              <option value="4">4 — Good</option>
              <option value="5">5 — Excellent</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="offered_booking"
                defaultChecked={log?.offered_booking ?? false}
                className="h-4 w-4 rounded border-ink-300 text-spark-500 focus:ring-spark-500"
              />
              Offered to book a class
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={log?.notes ?? ""}
            className={inputClass}
          />
        </div>

        {state.error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-surface-border pt-4">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete entry"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
            >
              Cancel
            </button>
            <SubmitButton label={isEdit ? "Save changes" : "Log it"} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
