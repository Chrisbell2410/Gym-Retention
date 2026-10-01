# Studio Spark

Internal sales tooling + (later) product for a done-for-you growth service for
independent boutique fitness studios in the Charleston, SC metro. Full
background and roadmap: [CLAUDE.md](./CLAUDE.md).

"Studio Spark" is a working codename, not a finalized brand — rename later is
a find-and-replace away.

## Stack

Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres + Auth + Row
Level Security), Anthropic Claude API for AI drafting, deployed on Vercel.
SMS/email/booking providers are behind small interfaces in `lib/providers/`
so swapping vendors later doesn't touch application code.

This project runs on **Next.js 16**, which renamed the `middleware.ts`
convention to `proxy.ts` (see [proxy.ts](./proxy.ts)) — if you're used to
older Next.js docs/tutorials, that's the one thing that looks different.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

**Already done.** The project exists — "Studio Spark", ref
`tadqbeaeroxauxuaxojv`, in the "Boutique Gym Rentention" org, region
`us-east-1` — public signups are disabled, your login
(chrisb.healthadvisor@gmail.com) is created, the Phase 1 schema is migrated,
and fake seed data is loaded. `.env.local` on this machine already has the
real URL + keys. Just run `npm run dev`.

If you're ever setting this up on a **different machine**, you don't need
to repeat any of the above — only:

1. Go to [supabase.com/dashboard/project/tadqbeaeroxauxuaxojv](https://supabase.com/dashboard/project/tadqbeaeroxauxuaxojv) > Project
   Settings > API Keys, and copy the Project URL, publishable key, and
   secret key into a new `.env.local` (copy `.env.example` first).
2. Optional, recommended before Phase 1 UI work: generate typed table
   definitions —
   ```bash
   npx supabase gen types typescript --project-id tadqbeaeroxauxuaxojv > types/supabase.ts
   ```

If this schema ever needs to move to a **new** Supabase project (a fresh
start, not just a new machine), the full from-scratch steps are: create the
project, disable public signups (Authentication > Sign In / Providers >
Email), create your one user (Authentication > Users > Add user), run
[`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
via the SQL Editor or `supabase db push`, and optionally load
[`supabase/seed.sql`](./supabase/seed.sql) after replacing
`REPLACE_WITH_YOUR_USER_ID` with the new user's UUID. Every row in that file
is invented — no real studio data belongs in this repo.

### 3. Other API keys

See the comments in [`.env.example`](./.env.example) for where to get each
one (Anthropic, Google Places, Resend) and which are actually required to run
the app vs. which can stay blank until a later phase.

### 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`. Enter your
email, click the magic link it sends you, and you'll land on `/dashboard`.

## Compliance notes (read before Phase 2)

- **A2P 10DLC registration**: Any business sending SMS in the US at volume
  needs to register a 10DLC campaign with the carriers (via OpenPhone or
  whichever SMS provider is in use) or messages will be filtered/blocked.
  This takes days to weeks to clear, so start it well before Phase 2's
  speed-to-lead engine needs to send a real text. OpenPhone has its own
  10DLC registration flow in their dashboard — do this before relying on SMS
  for anything pilot-grade.
- **TCPA**: SMS to a lead requires documented consent (source + timestamp).
  The schema and chat-widget consent capture for this land in Phase 2 — don't
  send automated texts to anyone before that's in place.
- **CAN-SPAM**: Cold outreach email (Phase 1) requires a working unsubscribe
  link, a physical address in the footer, and honoring opt-outs promptly —
  the `suppression_list` table and draft templates are built around this, but
  double-check the final templates before the first real send.

## Project structure

See the "Repo structure" section of [CLAUDE.md](./CLAUDE.md) for the full
directory layout and what lives where.

## Deploy

Push to GitHub, import into [Vercel](https://vercel.com/new), set the same
environment variables from `.env.local` in the Vercel project settings, and
deploy. No special build config needed.
