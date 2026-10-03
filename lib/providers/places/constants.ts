/**
 * Charleston-metro neighborhoods to search. Each entry's `dbValue` matches
 * the `studios.neighborhood` check constraint in
 * supabase/migrations/0001_init.sql exactly — if that constraint ever
 * changes, update it here too. A neighborhood can carry more than one
 * search query (North Charleston / Park Circle) while still tagging
 * results with one `dbValue`.
 *
 * Split out from client.ts (which also has the Places fetch call) so a
 * client component can import just these plain constants without pulling
 * in server-oriented fetch/API-key code.
 */
export const CHARLESTON_NEIGHBORHOODS = [
  { dbValue: "downtown_peninsula", label: "Downtown / Peninsula", queries: ["Downtown Charleston SC"] },
  { dbValue: "mount_pleasant", label: "Mount Pleasant", queries: ["Mount Pleasant SC"] },
  { dbValue: "west_ashley", label: "West Ashley", queries: ["West Ashley Charleston SC"] },
  { dbValue: "james_island", label: "James Island", queries: ["James Island SC"] },
  { dbValue: "daniel_island", label: "Daniel Island", queries: ["Daniel Island SC"] },
  { dbValue: "north_charleston_park_circle", label: "North Charleston / Park Circle", queries: ["North Charleston SC", "Park Circle Charleston SC"] },
  { dbValue: "summerville", label: "Summerville", queries: ["Summerville SC"] },
] as const;

/**
 * Studio categories to search. `dbValue` matches the `studios.category`
 * check constraint exactly.
 */
export const STUDIO_CATEGORIES = [
  { dbValue: "pilates", label: "Pilates", query: "pilates studio" },
  { dbValue: "yoga", label: "Yoga", query: "yoga studio" },
  { dbValue: "barre", label: "Barre", query: "barre studio" },
  { dbValue: "strength", label: "Strength", query: "strength training gym" },
  { dbValue: "cycle", label: "Cycling", query: "indoor cycling studio" },
  { dbValue: "hiit", label: "HIIT", query: "HIIT gym" },
] as const;
