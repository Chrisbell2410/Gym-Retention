-- Adds an email address to studios, needed to send outreach (Phase 1,
-- item 6) — nothing in the original schema captured one. Nullable and
-- purely additive: existing rows are unaffected, and a studio without an
-- email on file just can't have outreach sent to it yet (the Outreach
-- screen disables sending in that case rather than erroring).

alter table studios add column if not exists email text;
