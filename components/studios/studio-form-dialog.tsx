"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { createStudio, deleteStudio, updateStudio } from "@/lib/actions/studios";
import type { StudioActionState } from "@/lib/actions/studios";
import {
  addPipelineActivity,
  getStudioActivities,
} from "@/lib/actions/pipeline-activities";
import {
  NEIGHBORHOOD_LABELS,
  CATEGORY_LABELS,
  PIPELINE_STAGE_LABELS,
  BOOKING_PLATFORM_LABELS,
  ESTIMATED_SIZE_LABELS,
} from "@/lib/labels";
import type { Database } from "@/types/supabase";

type Studio = Database["public"]["Tables"]["studios"]["Row"];
type Activity = Database["public"]["Tables"]["pipeline_activities"]["Row"];

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  stage_change: "Stage change",
};

const INITIAL_STATE: StudioActionState = { error: null, success: false };

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

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  options,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  options?: Record<string, string>;
  step?: string;
  placeholder?: string;
}) {
  if (options) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <select
          name={name}
          defaultValue={defaultValue ?? ""}
          className={inputClass}
        >
          <option value="">—</option>
          {Object.entries(options).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        name={name}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className={inputClass}
      />
    </div>
  );
}

function ActivityHistory({ studioId }: { studioId: string }) {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [type, setType] = useState("note");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStudioActivities(studioId).then((data) => {
      if (!cancelled) setActivities(data);
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await addPipelineActivity(studioId, type, note);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNote("");
    const fresh = await getStudioActivities(studioId);
    setActivities(fresh);
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
        Activity
      </h3>

      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-ink-200 px-2 py-2 text-sm text-ink-700 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
        >
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
        </select>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened?"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={submitting || !note.trim()}
          className="shrink-0 rounded-md bg-ink-100 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-200 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {activities === null ? (
        <p className="text-sm text-ink-300">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-ink-300">No activity logged yet.</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {activities.map((a) => (
            <li key={a.id} className="rounded-md bg-surface p-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-700">
                  {ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                </span>
                <span className="text-xs text-ink-300">
                  {new Date(a.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {a.type === "stage_change" ? (
                <p className="text-ink-600">
                  {PIPELINE_STAGE_LABELS[a.previous_stage ?? ""] ?? a.previous_stage}
                  {" → "}
                  {PIPELINE_STAGE_LABELS[a.new_stage ?? ""] ?? a.new_stage}
                  {a.note && <span className="text-ink-400"> — {a.note}</span>}
                </p>
              ) : (
                a.note && <p className="text-ink-600">{a.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * NOTE: the parent must remount this component on every open (e.g.
 * `<StudioFormDialog key={formInstance} .../>` with `formInstance` bumped
 * each time it's opened) — that's what resets `useActionState` between
 * opens instead of showing a stale error/success from the previous one.
 */
export function StudioFormDialog({
  open,
  onClose,
  studio,
}: {
  open: boolean;
  onClose: () => void;
  studio?: Studio | null;
}) {
  const isEdit = Boolean(studio);
  const action = isEdit ? updateStudio.bind(null, studio!.id) : createStudio;
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

  const isBtone = studio?.franchise_brand === "btone FITNESS";

  async function handleDelete() {
    if (!studio) return;
    if (!confirm(`Delete ${studio.name}? This can't be undone.`)) return;
    setDeleting(true);
    const result = await deleteStudio(studio.id);
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
      title={isEdit ? studio!.name : "Add a studio"}
      widthClassName="max-w-2xl"
    >
      <form action={formAction} className="space-y-6">
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
            Basics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Name *" name="name" defaultValue={studio?.name} />
            </div>
            <Field label="Category" name="category" defaultValue={studio?.category} options={CATEGORY_LABELS} />
            <Field label="Neighborhood" name="neighborhood" defaultValue={studio?.neighborhood} options={NEIGHBORHOOD_LABELS} />
            <div className="col-span-2">
              <Field label="Address" name="address" defaultValue={studio?.address} />
            </div>
            <Field label="Phone" name="phone" defaultValue={studio?.phone} />
            <Field label="Email" name="email" type="email" defaultValue={studio?.email} />
            <Field label="Website" name="website" defaultValue={studio?.website} />
            <Field label="Instagram handle" name="instagram_handle" defaultValue={studio?.instagram_handle} placeholder="@studioname" />
            <Field label="Rating" name="rating" type="number" step="0.1" defaultValue={studio?.rating} />
            <Field label="Review count" name="review_count" type="number" defaultValue={studio?.review_count} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
            Franchise
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_franchise"
              name="is_franchise"
              defaultChecked={studio?.is_franchise ?? false}
              disabled={isBtone}
              className="h-4 w-4 rounded border-ink-300 text-spark-500 focus:ring-spark-500"
            />
            <label htmlFor="is_franchise" className="text-sm text-ink-700">
              This is a franchise (excluded from the pipeline by default)
            </label>
          </div>
          {isBtone && (
            <p className="mt-1 text-xs text-spark-700">
              btone is always excluded — conflict of interest, not editable.
            </p>
          )}
          <div className="mt-2">
            <Field label="Franchise brand" name="franchise_brand" defaultValue={studio?.franchise_brand} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
            Enrichment
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Booking platform" name="booking_platform" defaultValue={studio?.booking_platform} options={BOOKING_PLATFORM_LABELS} />
            <Field
              label="On ClassPass"
              name="on_classpass"
              defaultValue={
                studio?.on_classpass === true
                  ? "true"
                  : studio?.on_classpass === false
                    ? "false"
                    : ""
              }
              options={{ true: "Yes", false: "No" }}
            />
            <Field label="Intro offer" name="intro_offer" defaultValue={studio?.intro_offer} placeholder="e.g. 3 classes for $59" />
            <Field label="Class price ($)" name="class_price" type="number" step="0.01" defaultValue={studio?.class_price} />
            <Field label="Estimated size" name="estimated_size" defaultValue={studio?.estimated_size} options={ESTIMATED_SIZE_LABELS} />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-ink-400 uppercase">
              Pipeline
            </h3>
            {isEdit && (
              <div className="flex gap-3">
                <Link
                  href={`/studio-config/${studio!.id}`}
                  className="text-xs font-medium text-harbor-600 hover:text-harbor-700"
                >
                  AI Configuration →
                </Link>
                <Link
                  href={`/reports/${studio!.id}`}
                  className="text-xs font-medium text-harbor-600 hover:text-harbor-700"
                >
                  Response Time Report →
                </Link>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage" name="pipeline_stage" defaultValue={studio?.pipeline_stage ?? "researched"} options={PIPELINE_STAGE_LABELS} />
            <Field label="Lost reason" name="lost_reason" defaultValue={studio?.lost_reason} />
            <Field label="Next action" name="next_action" defaultValue={studio?.next_action} />
            <Field label="Next action date" name="next_action_date" type="date" defaultValue={studio?.next_action_date} />
          </div>
        </section>

        <section>
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={studio?.notes ?? ""}
            className={inputClass}
          />
        </section>

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
              {deleting ? "Deleting…" : "Delete studio"}
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
            <SubmitButton label={isEdit ? "Save changes" : "Add studio"} />
          </div>
        </div>
      </form>

      {isEdit && (
        <div className="mt-6 border-t border-surface-border pt-5">
          <ActivityHistory studioId={studio!.id} />
        </div>
      )}
    </Modal>
  );
}
