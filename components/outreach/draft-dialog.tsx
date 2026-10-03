"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  approveOutreachDraft,
  restoreOutreachDraftToDraft,
  sendOutreachDraft,
  skipOutreachDraft,
  updateOutreachDraft,
} from "@/lib/actions/outreach";
import type { DraftWithStudio } from "@/components/outreach/outreach-client";

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

const inputClass =
  "w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none";

export function DraftDialog({
  open,
  onClose,
  draft,
}: {
  open: boolean;
  onClose: () => void;
  draft: DraftWithStudio | null;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveEdits(): Promise<boolean> {
    if (!draft) return false;
    const fd = new FormData();
    fd.set("subject", subject);
    fd.set("body", body);
    const result = await updateOutreachDraft(draft.id, { error: null, success: false }, fd);
    if (result.error) {
      setError(result.error);
      return false;
    }
    return true;
  }

  function finish() {
    router.refresh();
    onClose();
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    const ok = await saveEdits();
    setBusy(false);
    if (ok) finish();
  }

  async function handleApprove() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    const saved = await saveEdits();
    if (!saved) {
      setBusy(false);
      return;
    }
    const result = await approveOutreachDraft(draft.id);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    finish();
  }

  async function handleRestore() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    const result = await restoreOutreachDraftToDraft(draft.id);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    finish();
  }

  async function handleSkip() {
    if (!draft) return;
    if (!confirm("Skip this draft? It won't be sent.")) return;
    setBusy(true);
    setError(null);
    const result = await skipOutreachDraft(draft.id);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    finish();
  }

  async function handleSend() {
    if (!draft) return;
    if (!confirm(`Send this email to ${draft.studios?.email}? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    const result = await sendOutreachDraft(draft.id);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    finish();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={draft ? draft.studios?.name ?? "Outreach draft" : "Outreach draft"}
      widthClassName="max-w-2xl"
    >
      {draft && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-500">
              {SEQUENCE_STEP_LABELS[draft.sequence_step] ?? `Step ${draft.sequence_step}`}
              {" · "}
              {draft.studios?.email ?? "No email on file"}
            </span>
            <Badge className={STATUS_BADGE_CLASSES[draft.status]}>
              {draft.status}
            </Badge>
          </div>

          {draft.status === "draft" ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-500">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-500">Body</label>
                <textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-ink-300">
                The CAN-SPAM footer (address + unsubscribe link) is appended
                automatically when this sends — it&apos;s not shown here
                while you&apos;re editing.
              </p>
            </>
          ) : (
            <div className="rounded-md bg-surface p-4">
              <p className="mb-2 text-sm font-medium text-ink-900">{draft.subject}</p>
              <p className="whitespace-pre-wrap text-sm text-ink-700">{draft.body}</p>
            </div>
          )}

          {draft.status === "sent" && (
            <p className="text-xs text-ink-300">
              Sent {draft.sent_at ? new Date(draft.sent_at).toLocaleString() : ""}
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-4">
            <div className="flex gap-2">
              {draft.status === "draft" && (
                <button
                  onClick={handleSkip}
                  disabled={busy}
                  className="text-sm text-ink-400 hover:text-ink-600 disabled:opacity-50"
                >
                  Skip
                </button>
              )}
              {(draft.status === "approved" || draft.status === "skipped") && (
                <button
                  onClick={handleRestore}
                  disabled={busy}
                  className="text-sm text-ink-400 hover:text-ink-600 disabled:opacity-50"
                >
                  {draft.status === "approved" ? "Back to draft" : "Restore as draft"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
              >
                Close
              </button>
              {draft.status === "draft" && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={busy}
                    className="rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                  >
                    Save changes
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={busy}
                    className="rounded-md bg-spark-500 px-4 py-2 text-sm font-medium text-white hover:bg-spark-600 disabled:opacity-50"
                  >
                    {busy ? "Working…" : "Approve"}
                  </button>
                </>
              )}
              {draft.status === "approved" && (
                <button
                  onClick={handleSend}
                  disabled={busy || !draft.studios?.email}
                  className="rounded-md bg-spark-500 px-4 py-2 text-sm font-medium text-white hover:bg-spark-600 disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Send now"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
