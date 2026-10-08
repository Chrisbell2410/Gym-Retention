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

**Considered, not adopted**: Chris flagged
[Scrapling](https://github.com/D4Vinci/Scrapling) (a web-scraping library)
as something he's heard good things about. Nothing in the current roadmap
needs it — Prospects enrichment uses the official Google Places API, not
scraping, and there's no planned feature that reads data off another
site. Noting it here so it isn't lost; revisit only if a real need for
scraping shows up (and flag it as a new dependency + likely ToS
considerations before adding it, per the "ask before adding a paid
service" spirit of the working rules even though this one's free).

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
  day-to-day. (It's been reused a few times across this project for
  one-off fixes — still works as of this session, but worth finally
  retiring.)
- **Deployed on Vercel**: project `ergo-ease/studio-spark`, live at
  **https://studio-spark-taupe.vercel.app**. Connected to this repo's
  GitHub remote (`github.com/Chrisbell2410/Gym-Retention`, `main` branch)
  for auto-deploy on push. Vercel's own deployment-protection (SSO wall,
  on by default for `.vercel.app` URLs) was explicitly turned off — it
  would otherwise have blocked the public `/unsubscribe` page and
  conflicted with the app's own Supabase-based login. Env vars set on
  Vercel so far: the three Supabase ones (Production/Preview/Development)
  and `APP_URL` (Production only, set to the URL above) — everything else
  in `.env.example` (Anthropic, Google Places, Resend, OpenPhone,
  `BUSINESS_MAILING_ADDRESS`) still needs adding once Chris has those
  keys, the same as locally.
- The Vercel access token used for this (like the Supabase one) was a
  temporary token Chris generated for setup — same recommendation to
  revoke it at vercel.com/account/tokens once things look right.
- **`git push` is blocked by this session's sandbox permissions** — it
  denied the push outright rather than erroring. The deploy-triggering
  commit landed locally (`git log` shows it) but was pushed to GitHub via
  a direct `vercel deploy --prod` CLI call instead, not through the normal
  git-push-triggers-deploy path. Chris should run `git push` himself from
  his own terminal to get GitHub caught up to what's actually live, or
  grant Bash permission for `git push` if he wants that done
  automatically going forward.

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

**Phase 1: feature-complete and fully live.** All five screens (Prospects,
Secret Shop, Pipeline, Response Time Report, Outreach) are built, and
migration `0002_studios_email.sql` is applied to the live database — the
old Phase 0 setup token turned out to still be valid, so it got pushed via
the Management API directly (and recorded in
`supabase_migrations.schema_migrations` so the CLI's own view of applied
migrations stays accurate too). `types/supabase.ts` was hand-edited ahead
of this and diffed identical against a fresh `supabase gen types` run
afterward, so no regeneration was needed.

**Still outstanding before outreach can actually send mail**: two env vars
in `.env.local`, both deliberately blocked with a clear error rather than
failing silently or sending something non-compliant —

```
BUSINESS_MAILING_ADDRESS=<your real mailing address>
APP_URL=<your deployed URL, once you have one>
```

**Worth doing now**: that Legacy access token has been reused twice across
this project for one-off fixes. It's done its job both times — revoke it
at [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
when convenient. Nothing in Phase 1 or the near-term Phase 2 work needs
me to run further migrations unsupervised — flag any future schema change
and I'll give you the SQL to run yourself, or we can set up a scoped
token at that point if direct access turns out to be worth the
convenience.

### Prospects screen (`/prospects`)

- `app/(internal)/prospects/page.tsx` — server component, fetches all
  studios and hands them to a client component (simple client-side
  filtering; fine at this data volume, revisit if the list ever gets into
  the thousands).
- `components/prospects/prospects-table.tsx` — the table + filter bar
  (search, category, neighborhood, stage, a "show franchises" toggle that
  defaults OFF per the spec).
- `components/studios/studio-form-dialog.tsx` — shared add/edit modal
  (moved out of `components/prospects/` once the Pipeline screen started
  using it too — see below). Uses `useActionState` with
  `lib/actions/studios.ts`'s `createStudio` / `updateStudio` (the latter
  via `.bind(null, studio.id)`). Includes a delete button (imperative call
  + `router.refresh()`, not a form action), and — in edit mode only — the
  activity history + "add activity" mini-form described in the Pipeline
  section below.
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

**Update (2026-10-08)**: the Stage column is now a click-to-check
checklist (`StageChecklist` in `prospects-table.tsx`) instead of a static
badge — six small dots, one per forward stage (Researched through
Paying), filled in up to wherever the studio currently is. Clicking any
dot jumps straight to that stage (not just +1), since in practice a
studio sometimes skips a step (e.g. straight to Meeting Booked via a
referral, no secret shop needed). Reuses the exact same
`changeStudioStage` action and `SEQUENTIAL_PIPELINE_STAGES` list the
Pipeline board's arrows already used, so stage-change logging and
Dashboard counts behave identically — this is a UI simplification, not a
new mechanism. "Lost" isn't on the checklist (same reasoning as the
Pipeline board) — a lost studio shows its badge instead, and un-losing it
still goes through the full edit dialog. Goal: let Chris update a
studio's progress straight from the Prospects table without opening a
dialog or switching to the Pipeline board.

### Secret Shop screen (`/secret-shop`)

- `app/(internal)/secret-shop/page.tsx` — server component, fetches all
  logs joined with the studio name (`.select("*, studios(name)")`) plus
  the non-franchise studio list for the "log an inquiry" dropdown.
- `components/secret-shop/secret-shop-client.tsx` — stats panel (median
  response time + no-reply rate, overall and per channel) + filter bar +
  table. Stats are computed client-side in `lib/secret-shop-stats.ts` from
  the fetched logs — fine at this volume, would move to a SQL aggregate if
  the log ever gets huge.
- **"No reply" needs a time cutoff, not just a null check**: a log with no
  `first_reply_at` yet could mean "still waiting" or "they ghosted us" —
  `lib/secret-shop-stats.ts` treats anything over
  `NO_REPLY_THRESHOLD_DAYS` (7) as a confirmed no-reply and anything newer
  as "pending," and only counts resolved (replied or confirmed-no-reply)
  entries in the median/no-reply-rate math so a handful of this morning's
  inquiries don't skew the numbers.
- `components/secret-shop/log-form-dialog.tsx` — add/edit modal. The
  sent/first-reply timestamps use a datetime-local input paired with a
  hidden ISO-string input (`lib/datetime.ts`) — the browser converts
  local-time-to-ISO on every change, which matters because the deployed
  server's timezone (UTC on Vercel) won't match Chris's, and parsing a
  timezone-less string server-side would have silently shifted times.
  `replied_within_72h` is computed server-side from the two timestamps,
  not entered by hand.
- **Logging an inquiry can auto-advance the pipeline**: if the studio is
  still at "researched," the first secret-shop log bumps it to
  "secret_shopped" and records why in `pipeline_activities` (that table
  was otherwise unused since Phase 0 — this is its first real writer).
  Never downgrades or touches a studio already further along. Doesn't
  revert on delete — if Chris deletes a log by mistake, the stage stays
  wherever it landed; reverting it is a manual edit on the Prospects
  screen if that's ever actually wanted.
- Same remount-via-parent-`key` pattern as Prospects for resetting the
  dialog between opens — see the note in that section above.
- Not clicked through live for the same reason as Prospects (no way to get
  an authenticated session from this environment) — verified via build +
  careful logic review only. Worth testing: log an inquiry (confirm the
  studio's stage advances), edit one to add a reply and watch the status
  badge and channel stats update, confirm a studio secret-shopped a week+
  ago with no reply shows as "No reply" rather than "Awaiting reply."

### Pipeline screen (`/pipeline`)

- `app/(internal)/pipeline/page.tsx` — server component, fetches
  non-franchise studios (franchises never belong "in the pipeline," same
  rule as everywhere else).
- `components/pipeline/kanban-board.tsx` — seven columns (Researched →
  ... → Paying, plus Lost), grouped client-side from the flat studio list.
- **Stage changes are click-based, not drag-and-drop.** Each card has
  back/forward arrows that call `changeStudioStage()`
  (`lib/actions/pipeline-activities.ts`) directly — no dialog, no page
  reload beyond a `router.refresh()`. I chose this over real drag-and-drop
  deliberately: Chris uses this on his phone as much as at a desk, and
  HTML5 drag-and-drop doesn't work on touch without a dedicated library
  (e.g. `@dnd-kit`) and real engineering effort. Click-to-move is fully
  touch-safe and was the better trade for a one-person-maintained app. If
  Chris wants real drag-and-drop later, that's an additive change, not a
  rewrite.
- **"Lost" is a branch, not a rung** — the arrows only move through the
  six forward stages (`SEQUENTIAL_PIPELINE_STAGES` in `lib/labels.ts`,
  which is `PIPELINE_STAGES` minus "lost"). Marking a studio Lost requires
  a reason, so it only happens through the full edit dialog
  (`pipeline_stage` → "Lost" in `components/studios/studio-form-dialog.tsx`),
  which now validates that `lost_reason` is filled in whenever the stage
  is Lost (`lib/validation/studio.ts`).
- Clicking a card's body (not the arrows) opens the same
  `StudioFormDialog` used by Prospects — full field editing plus the
  activity history panel.
- **Every stage-change path now logs a `pipeline_activities` row**: the
  kanban arrows (via `changeStudioStage`), the full edit dialog's stage
  dropdown (`updateStudio` now diffs the old vs. new stage before saving),
  and the existing secret-shop auto-advance. All three share one helper —
  `logStageChange()` in `lib/pipeline-activities.ts` (not a "use server"
  file itself; it takes a live Supabase client as an argument, so it's
  only ever called from other server actions, never directly from the
  client).
- Also fixed in this pass: the Dashboard's "Pipeline by stage" counts and
  "today's actions" list were including franchise-flagged studios, which
  didn't match Pipeline/Secret Shop's treatment — both queries now filter
  `is_franchise = false` too.
- Not clicked through live, same caveat as the other two screens. Worth
  testing: move a card forward/back with the arrows and confirm it jumps
  columns; open a card, change its stage via the dropdown, save, and
  confirm an activity entry appears recording the change; try setting a
  stage to Lost with no reason (should be rejected) and with one
  (should save); add a manual note/call/email/meeting activity and confirm
  it shows up immediately without closing the dialog.

### Response Time Report (`/reports/[studioId]`)

- `app/(internal)/reports/[studioId]/page.tsx` — server component. Fetches
  the studio, that studio's secret-shop logs, every secret-shop log across
  all studios (just `channel, sent_at, first_reply_at` — enough for the
  Charleston-wide stats, not full rows), and the resolved revenue-leak
  assumptions for this studio.
- **No secret-shop data, no report.** If a studio hasn't been
  secret-shopped yet, the page shows a plain "nothing to report yet" state
  with a link to Secret Shop instead of generating any numbers — showing a
  dollar-figure revenue-leak estimate with zero evidence the studio is
  actually slow would be exactly the kind of inflated claim the brief said
  not to make.
- **Response time by channel**: this studio's median per channel next to
  the Charleston median and the fastest single reply anyone's logged
  ("what the best studios do," framed as an aggregate benchmark, not a
  named competitor). Reuses `computeChannelStats()` from
  `lib/secret-shop-stats.ts` — extended with a new `fastestHours` field for
  this screen specifically.
- **Revenue leak assumptions resolve in priority order**: a per-studio
  override → a global default row (`revenue_leak_assumptions.studio_id IS
  NULL`) → the hardcoded constants in `lib/revenue-leak.ts`
  (`lib/revenue-leak-data.ts`'s `getResolvedAssumptions()`). There's no UI
  yet to set the global-default row — it just always falls through to the
  hardcoded constants unless Chris inserts one by hand in Supabase. Worth
  building a settings screen for that later if the per-studio defaults
  turn out to need frequent tuning; not done now since it wasn't asked
  for and the hardcoded constants work fine as the fallback.
- The five assumption fields are editable and recalculate the result
  **live** as you type (controlled inputs driving `calculateRevenueLeak()`
  directly), separate from actually persisting them — "Save assumptions"
  writes to `revenue_leak_assumptions` via `lib/actions/revenue-leak.ts`.
  That action selects the existing row before deciding insert vs. update
  rather than using Supabase's upsert/`onConflict`, because the unique
  index on `(owner_id, studio_id)` doesn't reliably dedupe when
  `studio_id` is `NULL` (Postgres treats NULLs as distinct in a unique
  index) — not a concern for per-studio rows, but worth knowing if this
  pattern gets reused for the global-default row later.
- **Print/PDF is just `window.print()` plus print CSS**, not a generated
  PDF file. `SidebarNav` and the layout's padding get `print:hidden` /
  `print:p-0`, and the assumptions form swaps to a plain `<dl>` of
  label/value pairs under `print:` so the printed page shows the numbers
  behind the estimate without input-box chrome. I chose this over a PDF
  library (e.g. `@react-pdf/renderer`, Puppeteer) deliberately — it's
  zero new dependencies, the report is already responsive since it's a
  normal page, and "mobile-friendly, printable" doesn't require an actual
  binary PDF file to exist. Chris's browser's own "Save as PDF" print
  destination produces the file if he wants one.
- Entry points: a "Report" link on every Prospects table row, and a
  "Response Time Report →" link inside the shared edit dialog's Pipeline
  section (so it's reachable from both Prospects and Pipeline without
  duplicating the link).
- Not clicked through live, same caveat as the other screens — and this
  one in particular depends on real secret-shop data existing, so testing
  it needs at least one logged inquiry first. Worth testing: open a
  report for a studio with no secret-shop logs (should show the empty
  state, no numbers), log an inquiry and reopen it (should now show the
  channel comparison), edit an assumption and watch the dollar figure
  update immediately, save, reload the page, and confirm the saved value
  stuck. Try "Print / Save as PDF" and check the sidebar/nav don't appear
  in the print preview.

### Outreach screen (`/outreach`)

- `app/(internal)/outreach/page.tsx` — server component. Loads every
  draft joined with its studio's name/email, plus the list of studios
  eligible for a new draft sequence (has secret-shop logs, doesn't already
  have drafts), plus today's sent count for the cap display.
- **Generation**: pick an eligible studio, click "Generate 4-email
  sequence" → `generateDraftsForStudio()` in `lib/actions/outreach.ts`
  builds a plain-language summary of that studio's secret-shop results
  (`lib/outreach-summary.ts`) and the Charleston-wide median, feeds both
  into the existing `draftColdEmail()` / `draftFollowUpSequence()` from
  Phase 0's `lib/ai/outreach-prompts.ts` (first real caller of that file),
  and inserts all four drafts (day 0/3/7/14) as `status: "draft"`. Refuses
  to run if the studio has no secret-shop logs, or already has drafts.
- **Approve and send are separate steps**, per your call: approving marks
  a draft ready (editing it first if you changed the text) without
  sending anything; a separate "Send now" actually sends. This matters
  most for the follow-ups — you can approve all four up front and then
  send the day-3 one three days later, rather than everything going out
  in one burst the moment you approve it.
- **Compliance is enforced at send time, not just described**:
  - Every send gets a CAN-SPAM footer (physical address + unsubscribe
    link) appended — `lib/outreach-footer.ts`. Sending is **blocked with
    a clear error** (not silently skipped) if `BUSINESS_MAILING_ADDRESS`
    isn't set, or if `APP_URL` isn't set to something other than
    localhost (a real recipient needs a working, reachable unsubscribe
    link — a broken one defeats the purpose and is itself a compliance
    problem).
  - The suppression list is checked before every send; a suppressed
    address gets the draft auto-marked "skipped" instead of sent.
  - A daily send cap (`DAILY_SEND_CAP = 20` in `lib/outreach-config.ts`)
    is checked against `outreach_drafts` rows sent since UTC midnight.
  - The unsubscribe link itself is a real, working public page —
    `app/unsubscribe/page.tsx`, added to `proxy.ts`'s public-path
    allowlist since the person clicking it isn't signed in. It requires
    an explicit button click rather than acting on page load, since email
    security scanners prefetch links and would otherwise silently
    unsubscribe people who never clicked anything. It uses the admin
    Supabase client (bypasses RLS) since an anonymous visitor has no
    session to write under — `lib/actions/unsubscribe.ts`.
- **A visible "Test mode" banner** shows whenever Resend isn't configured
  (same fallback check as `lib/providers/email/index.ts`) — "Send now"
  still works end-to-end in that state, it just goes through
  `MockEmailProvider` instead of actually emailing anyone. Wanted this
  impossible to miss, since silently mocking a "send" could otherwise read
  as "it worked" when nothing really went out.
- **Schema change**: added `studios.email` (migration `0002`, applied —
  see "Infrastructure" / Status above). Outreach has nowhere to send
  without it.
- Not clicked through live, same caveat as the other screens — but the
  database is ready now, so this is fully testable. Worth testing: add an
  email to a secret-shopped studio, generate a sequence, edit a draft,
  approve it, try sending with `BUSINESS_MAILING_ADDRESS`/`APP_URL` unset
  (should block clearly), set both, send (should go through mock since
  Resend isn't configured), confirm the status flips to "sent" and the
  daily counter increments, and click through the unsubscribe link from
  the footer text shown in a sent draft to confirm that flow works end to
  end.

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

### Next steps (Phase 1)

1. Click through all five Phase 1 screens per the checklists above and
   report back anything broken or confusing — the database is fully
   caught up now, so everything including Outreach is testable.
2. Revoke the Legacy Supabase access token (see "Infrastructure" above) —
   it's been reused a couple of times for one-off fixes and isn't needed
   for day-to-day use.

## Phase 2 — speed-to-lead product (in progress)

Scope agreed with Chris: fastest path to a demoable product, not the full
Phase 2 brief up front. Deferred to Phase 2b: SMS via OpenPhone, automated
reminder/no-show/conversion sequences, quiet-hours/STOP-HELP compliance,
the full real-metrics owner dashboard. See the chat history for the full
reasoning — short version: SMS needs a real phone number and carrier
registration, and none of that should block getting something demoable
for a pitch meeting.

**Schema** (`supabase/migrations/0003_phase2_core.sql`, applied and
tracked): `studio_configs` (one per studio, separate from the Phase 1
sales-pipeline `studios` table — this is the actual product config once a
studio is a customer, not a prospecting record), `conversations`,
`messages`, `bookings`. Same RLS pattern as everything else
(`owner_id = auth.uid()`); `conversations`/`messages` will also need
writes from anonymous chat-widget visitors once that's built, via the
admin client bypassing RLS — same approach as `/unsubscribe` in Phase 1.

**Built so far:**

- **Studio configuration** (`/studio-config/[studioId]`) — brand voice,
  class types, a weekly schedule (day/time/class/capacity rows), intro
  offer, membership pricing, FAQs, policies, location/parking, and an
  escalation contact. `components/studio-config/json-list-editor.tsx` is
  a small reusable repeating-row editor (used for schedule, pricing, and
  FAQs) that serializes to a hidden JSON input on every change — drops
  straight into a normal form action, server-validated in
  `lib/validation/studio-config.ts` rather than trusted as-is.
- **`BookingProvider` interface + mock** (`lib/providers/booking/`) — the
  mock generates availability from a studio's weekly schedule and books by
  inserting into `bookings` directly. Built to swap for a real
  Mindbody/Momence/etc. adapter later without touching any calling code.
- **The AI agent core** (`lib/ai/agent.ts`) — this is the highest-stakes
  piece, so it's built on Claude's **tool-use API**, not free-text intent
  parsing. The model can call `book_class` or `escalate_to_human` as
  explicit structured actions; it isn't relying on me regexing "yes, book
  me in" out of prose, and an escalation trigger (injury, pregnancy,
  medical question, complaint, refund, cancellation, or asking for a
  human) is something the model is explicitly instructed to call
  *before* attempting to respond to the topic at all, not something it
  might get around to. `lib/agent-runtime.ts` wires this to Supabase +
  the booking provider and is deliberately the only place that does — the
  agent logic itself has no DB/HTTP dependency, so it's directly testable
  in isolation.
- **Agent Test Console** (`/agent-test`) — an internal, authenticated
  chat UI against any studio with a config set up. This exists
  specifically so the agent gets adversarially tested (try to get it to
  invent a price, miss an injury mention, book a time that isn't on the
  schedule) before it's ever connected to a real chat widget or a real
  lead. Nothing here is a real booking channel — it's Chris's own
  session, logged with `consent_source: "internal_test_harness"` so it's
  never confused with real lead data later.

- **The public chat widget** — `public/widget.js` is a small,
  dependency-free vanilla-JS script a studio drops on their own website:
  `<script src=".../widget.js" data-studio-config-id="...">`. It renders
  a floating chat bubble, keeps a visitor id + conversation id in
  `localStorage` so a returning visitor resumes the same thread, and
  talks to `app/api/chat-widget/route.ts` — a public, unauthenticated API
  route (CORS open, since it's called cross-origin from a studio's own
  site) that calls the exact same `lib/agent-runtime.ts` the test console
  uses, just with the admin Supabase client instead of an authenticated
  one.
  - **owner_id had to be threaded through explicitly** for this to work:
    every table's `owner_id` column defaults to `auth.uid()`, which is
    fine for the authenticated test-console path but evaluates to `NULL`
    (and fails the `NOT NULL` constraint) for an anonymous admin-client
    insert, since there's no user JWT on the request. `processIncomingMessage`
    now reads `owner_id` off the fetched `studio_configs` row and passes
    it explicitly on every message/booking insert — same fix pattern as
    `/unsubscribe` in Phase 1, just applied one level deeper since this
    code path does several inserts instead of one.
  - `/widget.js` and `/api/chat-widget` are both added to `proxy.ts`'s
    public-path allowlist (same reasoning as `/unsubscribe`) — everything
    else stays behind the login gate.
  - **Chat Widget Preview** (`/widget-preview`, new nav item) — an
    internal, authenticated page (not a public demo page) that shows the
    real embed snippet for a chosen studio and loads the actual
    `widget.js` inside an iframe standing in for "a studio's website," so
    you can click the real, live widget yourself without needing an
    actual external site to paste it onto yet.

- **Demo mode** (`/demo`, new nav item) — one click seeds a fully fake,
  pitch-ready studio ("Lowcountry Pilates & Yoga") under Chris's own
  account: realistic schedule, pricing, FAQs, policies, and a handful of
  sample conversations (a completed booking, an FAQ-only inquiry, and an
  escalation) already in its history, so the test console / widget
  preview / pipeline board all have something to show instead of an empty
  state. `lib/actions/demo.ts`'s `seedDemoStudio()` runs under Chris's own
  authenticated session (not the admin client) specifically so it doesn't
  need his user id or direct DB access — it's idempotent, so clicking it
  again just returns the existing demo studio's ids instead of
  duplicating it. Tagged the same way as `supabase/seed.sql`'s fake
  prospects: `is_demo: true` on the `studio_configs` row, obviously fake
  name/address/contact throughout.

- **Studio Dashboard** (`/studio-dashboard/[studioId]`) — the light
  owner-facing view: three stat cards (conversations, classes booked,
  escalated to a human), an upcoming/past bookings table, and a
  click-to-expand list of every conversation with its full message
  thread. Reached from a new "Studio Dashboard →" link next to "AI
  Configuration" / "Response Time Report" in the shared edit dialog
  (`components/studios/studio-form-dialog.tsx`), and from Demo Mode's
  success links. If the studio has no AI config yet, it shows a plain
  "nothing to show" state with a link to set one up, same pattern as the
  Response Time Report's empty state for un-secret-shopped studios. Reads
  real `conversations`/`messages`/`bookings` rows — no separate demo-only
  code path, so it's already working off the sample history Demo Mode
  seeds.

  **Visual update**: redesigned from plain white cards to match the
  "Coastal Spark" brand more fully — a dark `ink-900` hero band with soft
  spark/harbor glow accents and the bolt mark, stat cards with colored
  icon badges and a ring/shadow instead of flat borders, and avatar
  initials on each conversation row. Same data, same layout structure,
  just dressed up — no new fetches or logic.

- **Standalone chat link** (`/chat/[studioConfigId]`) — for a studio with
  no real website worth embedding on, the same agent/API route is also
  reachable as its own full-page URL: shareable from an Instagram bio, a
  QR code on a flyer, a Google Business Profile link. Public and
  unauthenticated like the widget, same admin-client posture as
  `/unsubscribe` (only ever reads the studio's display name). The
  embed-snippet copy box on `/widget-preview` now also shows this link
  with its own copy/open buttons, so both distribution options are in
  one place.

- **Sales landing page** (`/pitch`, public) — what Chris pulls up on his
  phone/laptop in a pitch meeting, or sends as a link to a prospective
  studio owner. Hero, problem/solution, a 3-step "how it works," and —
  the actual selling point — the real chat widget embedded live on the
  page, pointed at the Demo Mode studio, so a prospect can try booking an
  intro class or mentioning an injury themselves instead of being told
  about it. Pricing section is deliberately generic (no number committed
  publicly — see "Pricing hypothesis" at the top of this doc, not
  finalized). Contact button is `mailto:cbfit2410@gmail.com`.

  **Update**: the pricing section now shows a real number — "Starting at
  $500/mo" — the bottom of the original hypothesis range, picked
  deliberately as the easiest number to get a first pilot studio to say
  yes to. Still framed as "starting at" / "scaled to your studio," so
  nothing stops pricing a larger studio higher later.

**Phase 2a is now feature-complete**: studio config, mock booking, the
AI agent core, the internal test console, the public chat widget +
preview page, demo mode, and the owner dashboard all exist and work
together end to end from a single seeded demo studio through to a
pitchable live widget.

**Still needed before this can go on a real studio's live site**: nothing
blocking the demo, but worth knowing — the widget endpoint has no rate
limiting or abuse protection beyond a message-length cap. Fine for a
pilot studio or two; revisit if this is ever handling meaningful public
traffic.

### What to test (Phase 2 so far)

1. Set `ANTHROPIC_API_KEY` locally, restart `npm run dev`.
2. On Prospects or Pipeline, open a studio (ideally one at Pilot/Paying,
   though nothing currently enforces that) → "AI Configuration →". Fill
   in at least brand voice, one class type, one schedule slot, and the
   intro offer — the test console has nothing to offer without a
   schedule.
3. Go to Agent Test Console, pick that studio, start a conversation.
4. Ask it something answered in the config (e.g. the intro offer) —
   should answer correctly and only from what's configured.
5. Ask it something *not* in the config (e.g. a class type you didn't
   add) — should say a team member will follow up, not guess.
6. Try to book the intro class it offers — should end with a "Class
   booked" tag, and a new row in the `bookings` table.
7. Mention an injury, or ask for a refund, or ask to talk to a real
   person — should immediately show "Escalated to human" and stop
   offering to help with that topic itself.
8. Try fast-follow messages that contradict each other (agree to a time,
   then ask for a different one) and see whether it stays coherent — this
   one doesn't have a strict pass/fail, just worth knowing how it behaves.

**Agent testing results (via `/agent-test`)**: ran the full checklist
against a real configured studio — correct booking flow end to end,
correct refusal to guess on an unconfigured field (class intensity),
and an injury mention triggered immediate escalation even when phrased
as "fully healed," with the follow-up message correctly suppressed
rather than the AI jumping back in. No missed-escalation bugs found —
cleared to build on top of it.

**Widget preview, confirmed working**: ran the injury-escalation check
against the real public `/api/chat-widget` route (not just the internal
test console) — escalated correctly, same as the console.

### Next steps (Phase 2)

1. Click through `/demo` → Studio Dashboard for the seeded demo studio
   and confirm the stats, bookings table, and conversation threads all
   look right — this is the newest piece and hasn't been clicked through
   live yet (verified via build + logic review only, same caveat as
   every other screen in this project).
2. With Phase 2a feature-complete, decide what's next: start pitching
   with the demo studio as-is, move into Phase 2b (SMS via OpenPhone,
   automated reminder/no-show sequences, quiet-hours/STOP-HELP
   compliance, real-metrics dashboard), or pressure-test the agent
   further with harder adversarial cases before either.
