import { Clock, MessageCircleQuestion, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function PitchPage({ demoStudioConfigId }: { demoStudioConfigId: string | null }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-surface-border px-5 py-4 sm:px-10">
        <Logo />
        <a
          href="#contact"
          className="rounded-md bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800"
        >
          Get in touch
        </a>
      </header>

      {/* Hero */}
      <section className="px-5 py-16 text-center sm:px-10 sm:py-24">
        <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Stop losing new members to a slow reply.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500">
          Studio Spark answers every lead in seconds, books their first class,
          and brings in your team for anything that actually needs a human —
          nights, weekends, mid-class, doesn&apos;t matter.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#demo"
            className="rounded-md bg-spark-500 px-6 py-3 text-sm font-semibold text-white hover:bg-spark-600"
          >
            See it live
          </a>
          <a
            href="#contact"
            className="rounded-md border border-ink-200 px-6 py-3 text-sm font-semibold text-ink-700 hover:bg-white"
          >
            Get in touch
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-surface-border bg-white px-5 py-14 sm:px-10">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          <ProblemCard
            icon={<Clock size={20} />}
            text="Most boutique studios take hours — sometimes days — to reply to a new web form or DM."
          />
          <ProblemCard
            icon={<MessageCircleQuestion size={20} />}
            text="Most prospective members don't wait around. They just try the next studio on their list."
          />
          <ProblemCard
            icon={<Zap size={20} />}
            text="Every unanswered lead is a membership that went somewhere else — one you already paid to attract."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 sm:px-10">
        <h2 className="text-center font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          How it works
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="A lead reaches out"
            text="Through a chat widget on your site, or a shareable link on Instagram, a QR code, or your Google listing — no app to download, nothing to install."
          />
          <Step
            number="2"
            title="The AI answers instantly"
            text="From your real pricing, schedule, and policies — never a guess, never an invented answer. If it doesn't know, it says a team member will follow up."
          />
          <Step
            number="3"
            title="It books the class, or brings in your team"
            text="A ready lead gets booked into an intro class right then. An injury, a refund request, a complaint, or anyone who wants to talk to a person gets handed off immediately — before the AI says anything else on the topic."
          />
        </div>
      </section>

      {/* Live demo */}
      <section id="demo" className="border-y border-surface-border bg-ink-900 px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <ShieldCheck size={28} className="mx-auto mb-3 text-harbor-400" />
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Try it yourself
          </h2>
          <p className="mt-3 text-ink-300">
            This is a fake studio — Lowcountry Pilates &amp; Yoga — running
            the real product. Click the chat bubble in the bottom-right
            corner of this page. Ask about pricing or class times, or try
            mentioning an injury and watch it hand off instead of guessing.
          </p>
          {!demoStudioConfigId && (
            <p className="mt-6 text-sm text-ink-400">
              (Live demo not set up yet — ask Chris to show you.)
            </p>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 py-16 text-center sm:px-10">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          Simple, studio-sized pricing
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-500">
          One flat monthly rate, scaled to your studio — with a performance
          guarantee. If it isn&apos;t paying for itself, let&apos;s talk.
        </p>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-surface-border bg-white px-5 py-16 text-center sm:px-10">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          Ready to see what this looks like for your studio?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink-500">
          Let&apos;s set up a quick call, or I&apos;ll come show you in
          person.
        </p>
        <a
          href="mailto:cbfit2410@gmail.com"
          className="mt-6 inline-block rounded-md bg-spark-500 px-6 py-3 text-sm font-semibold text-white hover:bg-spark-600"
        >
          Email Chris
        </a>
      </section>

      <footer className="px-5 py-8 text-center text-xs text-ink-300 sm:px-10">
        Studio Spark — Charleston, SC
      </footer>

      {demoStudioConfigId && (
        <script async src="/widget.js" data-studio-config-id={demoStudioConfigId} />
      )}
    </div>
  );
}

function ProblemCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-lg border border-surface-border p-5">
      <div className="mb-3 inline-flex rounded-full bg-spark-50 p-2 text-spark-600">{icon}</div>
      <p className="text-sm text-ink-600">{text}</p>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 font-display text-sm font-bold text-white">
        {number}
      </div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-500">{text}</p>
    </div>
  );
}
