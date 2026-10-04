"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveStudioConfig } from "@/lib/actions/studio-config";
import type { StudioConfigActionState } from "@/lib/actions/studio-config";
import { JsonListEditor } from "@/components/studio-config/json-list-editor";
import type { Database } from "@/types/supabase";

type StudioConfig = Database["public"]["Tables"]["studio_configs"]["Row"];

const INITIAL_STATE: StudioConfigActionState = { error: null, success: false };

const inputClass =
  "w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-ink-500";

const DAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-spark-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-spark-600 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save configuration"}
    </button>
  );
}

export function StudioConfigForm({
  studioId,
  studioName,
  config,
}: {
  studioId: string;
  studioName: string;
  config: StudioConfig | null;
}) {
  const [state, formAction] = useActionState(
    saveStudioConfig.bind(null, studioId),
    INITIAL_STATE,
  );

  const schedule = (config?.schedule as Record<string, string | number>[]) ?? [];
  const pricing = (config?.pricing as Record<string, string | number>[]) ?? [];
  const faqs = (config?.faqs as Record<string, string | number>[]) ?? [];

  return (
    <form action={formAction} className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          {studioName} — AI Configuration
        </h1>
        <p className="text-sm text-ink-400">
          Everything the AI agent is allowed to say comes from this page. It
          never invents a price, policy, or class time — if something
          isn&apos;t here, it tells the lead a team member will follow up.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Voice
        </h2>
        <label className={labelClass}>Brand voice / tone</label>
        <textarea
          name="brand_voice"
          rows={2}
          defaultValue={config?.brand_voice ?? ""}
          placeholder="e.g. Warm, encouraging, a little playful. Short sentences. Never pushy."
          className={inputClass}
        />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Classes
        </h2>
        <label className={labelClass}>Class types (comma-separated)</label>
        <input
          type="text"
          name="class_types"
          defaultValue={(config?.class_types as string[] | null)?.join(", ") ?? ""}
          placeholder="Reformer Flow, Beginner Pilates, Sculpt"
          className={inputClass}
        />
        <div className="mt-3">
          <JsonListEditor
            name="schedule"
            label="Weekly schedule"
            addLabel="Add a class time"
            initialRows={schedule}
            fields={[
              { key: "dayOfWeek", label: "Day", type: "select", options: DAY_OPTIONS },
              { key: "time", label: "Time", placeholder: "09:00" },
              { key: "className", label: "Class", placeholder: "Reformer Flow" },
              { key: "capacity", label: "Capacity", type: "number", placeholder: "12" },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Offer & pricing
        </h2>
        <label className={labelClass}>Intro offer</label>
        <input
          type="text"
          name="intro_offer"
          defaultValue={config?.intro_offer ?? ""}
          placeholder="3 classes for $59"
          className={inputClass}
        />
        <div className="mt-3">
          <JsonListEditor
            name="pricing"
            label="Membership options"
            addLabel="Add a membership option"
            initialRows={pricing}
            fields={[
              { key: "name", label: "Name", placeholder: "Unlimited Monthly" },
              { key: "price", label: "Price", type: "number", placeholder: "175" },
              { key: "description", label: "Description", placeholder: "Unlimited classes, no commitment" },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          FAQs
        </h2>
        <JsonListEditor
          name="faqs"
          label="Frequently asked questions"
          addLabel="Add an FAQ"
          initialRows={faqs}
          fields={[
            { key: "question", label: "Question" },
            { key: "answer", label: "Answer" },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Policies & location
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Cancellation policy</label>
            <textarea
              name="cancellation_policy"
              rows={2}
              defaultValue={config?.cancellation_policy ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Late arrival policy</label>
            <textarea
              name="late_arrival_policy"
              rows={2}
              defaultValue={config?.late_arrival_policy ?? ""}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Location / parking</label>
            <textarea
              name="location_parking"
              rows={2}
              defaultValue={config?.location_parking ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
          Escalation contact
        </h2>
        <p className="mb-2 text-xs text-ink-400">
          Who gets notified when the AI hands off — injury, pregnancy,
          medical questions, complaints, refunds, cancellations, or anyone
          asking for a real person.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            name="escalation_contact_name"
            defaultValue={config?.escalation_contact_name ?? ""}
            placeholder="Name"
            className={inputClass}
          />
          <input
            type="text"
            name="escalation_contact_phone"
            defaultValue={config?.escalation_contact_phone ?? ""}
            placeholder="Phone"
            className={inputClass}
          />
          <input
            type="email"
            name="escalation_contact_email"
            defaultValue={config?.escalation_contact_email ?? ""}
            placeholder="Email"
            className={inputClass}
          />
        </div>
      </section>

      {state.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-harbor-50 p-3 text-sm text-harbor-700">
          Saved.
        </p>
      )}

      <div className="flex justify-end border-t border-surface-border pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
