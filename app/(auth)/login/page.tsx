"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";

/**
 * Single-user login screen. There's no signup flow on purpose: the only
 * account is you. Create it once in the Supabase dashboard
 * (Authentication > Users > Add user) and disable public signups
 * (Authentication > Sign In / Providers > Email > disable "Allow new users
 * to sign up") — see README.md "Supabase setup" for the full checklist.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-4">
      {/* Soft ambient glow, purely decorative */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-spark-600 opacity-20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-ink-700 bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <Logo size={32} />
        </div>
        <h1 className="mb-1 text-xl font-semibold text-ink-900">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-ink-400">
          Internal sales tool. Sign in with your email to get a magic link.
        </p>

        {status === "sent" ? (
          <p className="rounded-md bg-harbor-50 p-3 text-sm text-harbor-800">
            Check your inbox for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-spark-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-spark-600 disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
