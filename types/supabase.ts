/**
 * Placeholder. Once your Supabase project exists and the migration in
 * supabase/migrations/0001_init.sql has been applied, generate real types
 * with the Supabase CLI and replace this file:
 *
 *   npx supabase login
 *   npx supabase gen types typescript --project-id <your-project-ref> > types/supabase.ts
 *
 * Until then, `createClient()` calls are untyped (effectively `any` for
 * table rows) — fine for Phase 0, worth doing before Phase 1's UI work
 * leans on autocomplete for column names.
 */
export type Database = Record<string, unknown>;
