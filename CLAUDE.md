# Studio Spark — Project Context

## Who this is for

Chris Bell, Charleston SC. Group fitness instructor (background in exercise
physiology + sales), building a done-for-you growth service for independent
boutique fitness studios (Pilates, yoga, barre, strength, cycling, HIIT) in
the Charleston metro. Not a full-time engineer — explain decisions in plain
English, prefer boring/reliable tech, keep this maintainable by one person.

Chris previously built "PipelineOS" (Node.js/SQLite lead-gen system). This is
a new, separate codebase — nothing is shared or ported.

## The business

Franchises are excluded (their tech is corporate-mandated, not a fit). The
offer stack, in priority order:

1. **CORE**: Speed-to-lead + intro-offer conversion engine (AI replies
   <60s, books intro class, runs reminder + conversion sequences).
2. **ENTRY OFFER**: Database reactivation campaign (one-time project, door-opener
   for #1).
3. **LATER**: 90-day new-member activation/retention layer.

Pricing hypothesis: $500–1,500/mo per studio with a performance guarantee.
Goal: land 1–3 pilot studios in the first 30 days. Build order: sales tooling
→ demo product → pilot-grade product. Don't over-engineer early phases.

## Decisions made (Phase 0)

| Area | Decision | Why |
|---|---|---|
| Repo | New standalone repo | Clean slate, no PipelineOS coupling |
| Brand name | "Studio Spark" — **confirmed as the real, permanent brand** | Chris committed to it when the visual identity was built; carries through to outreach emails, the Response Time Report, and the future customer-facing demo |
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind | Default stack, Vercel-native |
| Backend | Supabase (Postgres + Auth + RLS) | Chris's preferred stack |
| AI | Anthropic Claude API, default model `claude-sonnet-5` | Capable + cost-sensible for drafting tasks |
| SMS | OpenPhone, behind `SmsProvider` interface | Chris already has this account; Twilio swap-in possible later |
| Outreach email | Resend | Purpose-built for transactional/outreach mail; needs a verified sending domain (blocked until brand/domain is finalized) |
| Deploy | Vercel | Zero-ops, pairs with Next.js |
| Auth | Supabase magic-link, single allowlisted user (no public signup) | This is Chris's internal tool only, in Phase 1/2 |

**Known gap**: cold outreach can be drafted and reviewed, but can't actually
send yet — Resend needs a verified domain, and the brand/domain isn't final.
Not blocking anything else; revisit once a domain is chosen.

## Brand & design system ("Coastal Spark")

Researched by looking at solidcore, Barry's, YogaSix, and CycleBar's sites
for color/mood reference, then landed on a direction distinct from all four:

- **Colors** (Tailwind v4 tokens in `app/globals.css`, inside `@theme` so
  utilities like `bg-spark-500` work): `spark` — a coral-to-ember orange,
  the primary brand accent (literal: a spark/ignition). `harbor` — a
  Charleston-harbor teal, secondary accent, used for "good news" states
  (e.g. the Pilot stage count on the dashboard). `ink` — deep navy-charcoal,
  used for dark surfaces (the sidebar) instead of pure black. `surface` /
  `surface-border` — a warm off-white page background instead of stark
  Tailwind gray, so a full day of CRM data entry doesn't feel clinical.
- **Logo**: `components/ui/logo.tsx` — a custom angular bolt mark (not a
  generic lightning-bolt icon asset) in a `spark` gradient, paired with the
  wordmark set in Space Grotesk (a bolder geometric display font, loaded
  alongside the existing Geist body font via `next/font/google`). The same
  bolt mark, on a filled rounded-square badge, is `app/icon.svg` — Next.js's
  file-based convention picks this up automatically as the favicon/app icon.
- **Navigation**: `components/ui/sidebar-nav.tsx` replaced the old flat top
  nav bar. Left sidebar (ink-900 background) on desktop, collapsing to a
  hamburger-triggered overlay drawer on mobile; nav items are grouped
  ("Workspace" vs "Sales Pipeline") and highlight the active route via
  `usePathname` (the old nav had no active-state indication at all).
- Icons throughout come from `lucide-react` (new dependency) rather than
  hand-drawn SVGs, except the logo mark itself.

This was a visual-only pass — no data model, auth, or business-logic
changes. Not yet re-verified by Chris signing in and looking at the new
sidebar/dashboard himself (I verified the login page and logo render
correctly via screenshot, but couldn't complete a real magic-link sign-in
from this session to screenshot the authenticated sidebar — that needs
Chris's own inbox).

## Infrastructure (live)

- **Supabase project**: "Studio Spark", ref `tadqbeaeroxauxuaxojv`, org
  "Boutique Gym Rentention", region `us-east-1`. Public signups are
  disabled; the only account is Chris's (chrisb.healthadvisor@gmail.com),
  created directly via the Admin API. Phase 1 migration
  (`supabase/migrations/0001_init.sql`) is applied, and the fake seed data
  from `supabase/seed.sql` is loaded for local testing.
- **`.env.local`** (gitignored, not in the repo) has the real project URL +
  publishable key + secret key. If this ever needs regenerating on a new
  machine: project URL is `https://tadqbeaeroxauxuaxojv.supabase.co`, keys
  are in the Supabase dashboard under Project Settings > API Keys.
- The database password was generated during setup and isn't stored
  anywhere in this repo or recorded in chat — if direct Postgres access is
  ever needed (e.g. via `psql`), reset it from the dashboard under Database
  > Settings.
- The Supabase personal access token used to provision all of this was a
  temporary "Legacy" (classic) token — recommend revoking it at
  supabase.com/dashboard/account/tokens once you've confirmed everything
  above works, since it carries full account access and isn't needed
  day-to-day.

**Next.js 16 note**: `middleware.ts` was renamed to `proxy.ts` (exports a
`proxy` function instead of `middleware`) — see [proxy.ts](./proxy.ts). If
anything you read elsewhere mentions `middleware.ts`, that's the old name.

## Repo structure

```
app/
  (auth)/login/            # magic-link sign-in, outside the authenticated nav
  auth/callback/           # Supabase magic-link redirect target
  (internal)/              # the actual internal tool, gated by proxy.ts
    layout.tsx             # nav + sign-out
    dashboard/             # pipeline stage counts + today's actions
    prospects/              # Phase 1: prospect DB (placeholder for now)
    secret-shop/            # Phase 1: secret-shop log (placeholder for now)
    pipeline/               # Phase 1: kanban (placeholder for now)
    reports/[studioId]/     # Phase 1: Response Time Report (placeholder for now)
    outreach/                # Phase 1: AI draft review/approval (placeholder for now)
components/
  ui/                       # shared primitives (sign-out button, etc.)
lib/
  supabase/                 # client.ts (browser), server.ts (server components/actions)
  providers/
    sms/                    # SmsProvider interface + OpenPhoneProvider + MockSmsProvider
    email/                  # EmailProvider interface + ResendEmailProvider + MockEmailProvider
    places/                 # Google Places (New) Text Search client
  ai/
    claude.ts               # Anthropic client + default model
    outreach-prompts.ts      # draftColdEmail() + draftFollowUpSequence()
  enrichment/
    booking-platform-detector.ts  # regex-based, not AI — deterministic & cheap
  franchise-list.ts          # seed list + btone hard-exclusion (also enforced in DB)
  revenue-leak.ts             # Response Time Report revenue-leak math, assumptions editable
supabase/
  migrations/0001_init.sql    # full Phase 1 schema, RLS on every table
  seed.sql                    # FAKE demo data only — replace owner_id placeholder before running
types/supabase.ts              # placeholder; regenerate once a real Supabase project exists
proxy.ts                        # Next.js 16's middleware.ts replacement — session refresh + auth gate
```

## Data model (Phase 1)

Every table has `owner_id uuid references auth.users` + an RLS policy of
`owner_id = auth.uid()`. There's only one user today, but this means Phase
3's per-studio multi-tenant accounts need zero schema migration — just new
rows with a different `owner_id`.

- **`franchise_brands`** — editable exclusion list. `btone FITNESS` is
  seeded with `always_exclude = true` and is protected by a DB trigger
  (`protect_btone_exclusion`) that blocks changing or deleting that row —
  this is a hard conflict-of-interest rule, not a preference.
- **`studios`** — the prospect database. `pipeline_stage` is the kanban
  column (`researched → secret_shopped → contacted → meeting_booked → pilot
  → paying → lost`). `booking_platform_source` tracks whether the detected
  platform was auto-detected or manually corrected.
- **`secret_shop_logs`** — one row per manual inquiry Chris sends (web form /
  Instagram DM / phone / email). Nothing in this codebase sends an inquiry
  automatically — that's always a human action, logged after the fact.
- **`pipeline_activities`** — activity history per studio (notes, stage
  changes, calls, emails, meetings).
- **`outreach_drafts`** — AI-drafted cold emails + 3-touch follow-ups
  (day 0/3/7/14), `status` moves draft → approved → sent only with Chris's
  explicit approval in the UI (not built yet).
- **`suppression_list`** — CAN-SPAM opt-outs/bounces, checked before any send.
- **`revenue_leak_assumptions`** — editable inputs (leads/mo, close rates,
  price, retention) behind the Response Time Report's revenue-leak estimate,
  per-studio or global default.

## Working rules (from Chris)

- Ask before: adding any paid service, anything that sends real messages,
  schema changes after Phase 1 ships.
- Small, testable steps, clear commits.
- End of each phase: a "what to test" checklist here, plus updated status.
- Fake seed data only in the repo/tests — never real studio data.
- Secrets live only in `.env.local`, never committed.
- Flag legal/compliance risk (TCPA, CAN-SPAM, platform ToS) before building
  around it, and propose a safer alternative.
- Out of scope for now: 90-day activation layer, ClassPass conversion
  module, failed-payment recovery, instructor scheduling, automated social
  posting.

## Status

**Phase 0: done, fully live.** Repo scaffolded, Supabase project created and
schema + RLS applied (see "Infrastructure" above), auth flow (magic link +
route gating) wired and confirmed working end-to-end against the live
project, Chris's one login user created, fake seed data loaded, provider
interfaces (SMS/email/places) stubbed with mock fallbacks so nothing
sends/costs money until real keys are added, AI client + outreach prompt
templates written, docs written.

**Phase 1: in progress.** Prospects screen is built (see below). Still to
build: secret-shop log entry + Charleston-median calculations, kanban
pipeline board, Response Time Report rendering (print/PDF), outreach draft
review/approval screen with send-cap + suppression-list enforcement.

### Prospects screen (`/prospects`)

- `app/(internal)/prospects/page.tsx` — server component, fetches all
  studios and hands them to a client component (simple client-side
  filtering; fine at this data volume, revisit if the list ever gets into
  the thousands).
- `components/prospects/prospects-table.tsx` — the table + filter bar
  (search, category, neighborhood, stage, a "show franchises" toggle that
  defaults OFF per the spec).
- `components/prospects/studio-form-dialog.tsx` — shared add/edit modal.
  Uses `useActionState` with `lib/actions/studios.ts`'s `createStudio` /
  `updateStudio` (the latter via `.bind(null, studio.id)`). Includes a
  delete button (imperative call + `router.refresh()`, not a form action).
- `components/prospects/csv-import-dialog.tsx` — upload a CSV (parsed
  server-side with `papaparse`), with a downloadable blank template and a
  per-row skip-reason list so a bad row doesn't silently vanish.
- `components/prospects/places-sync-dialog.tsx` — lets Chris pick which
  neighborhoods/categories to search (shows the exact request count before
  running, since each combination is a paid Google Places call) and calls
  `syncFromGooglePlaces`. Only ever **adds** studios not already matched by
  `google_place_id` — never overwrites an existing row, so it's always
  safe to re-run.
- **btone exclusion is enforced at three layers**, not just the DB trigger
  from Phase 0: `enforceBtoneExclusion()` in `lib/actions/studios.ts` runs
  on every create/update/CSV-import/Places-sync path, so there's no way to
  get a btone-named studio un-flagged short of hand-editing the database.
- All three dialogs rely on a `key={...Instance}` from the parent to force
  a remount on every open (resets `useActionState` so a stale error/success
  from the previous open never flashes) — if you ever see stale dialog
  state, check that the parent is bumping the instance counter before
  opening, not passing it as a prop for the dialog to key itself.
- **Not tested with real data yet** — I verified this with `npm run build`
  (full type-check against the generated Supabase types) and a careful
  logic re-read, but couldn't click through it myself (see "Known
  limitation" in the Phase 0 entry above — no way to get an authenticated
  browser session from this environment). Worth clicking through yourself:
  add a studio, edit one, delete one, import the downloaded CSV template
  with a row or two filled in, and try "Sync from Places" once
  `GOOGLE_PLACES_API_KEY` is set (it'll show a clear error if the key is
  still missing, not a crash).

### What to test (Phase 0 — still holds)

Supabase is live and `.env.local` is already filled in on this machine, so
all of these should work right now:

1. `npm run dev` — app starts with no errors, picks up `.env.local`.
2. Visiting `http://localhost:3000` redirects to `/login`.
3. Enter your email (chrisb.healthadvisor@gmail.com) — you get a magic
   link. Clicking it lands you on `/dashboard`, signed in.
4. `/dashboard` loads and shows non-zero stage counts (7 fake seed studios
   across several pipeline stages) and today's actions (empty unless a
   seeded studio's `next_action_date` happens to be today).
5. Signing out returns you to `/login` and visiting `/dashboard` again
   redirects back to `/login`.
6. `npm run build` completes without TypeScript errors.

If you ever set this up on a different machine, `.env.local` won't exist
there — see README.md "Supabase setup" for how to get the values (the
project already exists, so skip straight to copying the keys from the
dashboard rather than creating a new project).

### Next steps

1. Click through the Prospects screen per the checklist above and report
   back anything broken or confusing.
2. Once confirmed, consider revoking the temporary Supabase "Legacy"
   access token used for setup (see "Infrastructure" above) — it's not
   needed for day-to-day use.
3. Continue Phase 1: secret-shop log UI + Charleston-median calculations,
   pipeline kanban, Response Time Report rendering, outreach draft
   review/approval screen.
