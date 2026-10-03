"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { confirmUnsubscribe } from "@/lib/actions/unsubscribe";

/**
 * Public page (see proxy.ts's isPublicPath) — the person here received a
 * cold email and isn't signed in. Deliberately requires a button click
 * rather than acting on page load: an email security scanner prefetching
 * this URL would otherwise silently unsubscribe people who never clicked
 * anything themselves.
 */
export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeCard />
    </Suspense>
  );
}

function UnsubscribeCard() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const studio = params.get("studio") ?? "";

  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setStatus("working");
    const result = await confirmUnsubscribe(email, studio);
    if (!result.success) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setStatus("done");
  }

  const missingInfo = !email || !studio;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-700 bg-white p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo size={28} />
        </div>

        {missingInfo ? (
          <p className="text-sm text-ink-500">
            This unsubscribe link is missing information and can&apos;t be
            processed.
          </p>
        ) : status === "done" ? (
          <>
            <h1 className="mb-2 text-lg font-semibold text-ink-900">
              You&apos;re unsubscribed
            </h1>
            <p className="text-sm text-ink-500">
              {email} won&apos;t receive any more emails from us.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-lg font-semibold text-ink-900">
              Unsubscribe
            </h1>
            <p className="mb-5 text-sm text-ink-500">
              Stop emails from Studio Spark to <strong>{email}</strong>?
            </p>
            <button
              onClick={handleConfirm}
              disabled={status === "working"}
              className="w-full rounded-md bg-spark-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-spark-600 disabled:opacity-50"
            >
              {status === "working" ? "Working…" : "Confirm unsubscribe"}
            </button>
            {status === "error" && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
