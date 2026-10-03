"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import { studioInputSchema } from "@/lib/validation/studio";
import { isAlwaysExcluded } from "@/lib/franchise-list";
import {
  searchText,
  CHARLESTON_NEIGHBORHOODS,
  STUDIO_CATEGORIES,
} from "@/lib/providers/places/client";
import type { Database } from "@/types/supabase";

export type StudioActionState = { error: string | null; success: boolean };

type StudioInsert = Database["public"]["Tables"]["studios"]["Insert"];
type FranchiseBrandRow =
  Database["public"]["Tables"]["franchise_brands"]["Row"];

/** Matches a studio name against the owner's franchise_brands list (DB is
 * the source of truth so Chris's edits there are always respected), with
 * the btone hard-exclusion enforced on top regardless of what's in the DB. */
function detectFranchiseFromDb(
  name: string,
  brands: Pick<FranchiseBrandRow, "brand_name" | "match_patterns">[],
): { isFranchise: boolean; franchiseBrand: string | null } {
  if (isAlwaysExcluded(name)) {
    return { isFranchise: true, franchiseBrand: "btone FITNESS" };
  }
  const lower = name.toLowerCase();
  for (const brand of brands) {
    if (brand.match_patterns.some((p) => lower.includes(p.toLowerCase()))) {
      return { isFranchise: true, franchiseBrand: brand.brand_name };
    }
  }
  return { isFranchise: false, franchiseBrand: null };
}

// ---------------------------------------------------------------------------
// Create / update / delete
// ---------------------------------------------------------------------------

/** btone can never be unflagged as a franchise through any path, including
 * a direct manual edit — matches the DB-level trigger on franchise_brands
 * (supabase/migrations/0001_init.sql) and the CSV-import logic below. */
function enforceBtoneExclusion<T extends { name: string }>(
  data: T,
): T & { is_franchise: boolean; franchise_brand?: string } {
  if (isAlwaysExcluded(data.name)) {
    return { ...data, is_franchise: true, franchise_brand: "btone FITNESS" };
  }
  return data as T & { is_franchise: boolean; franchise_brand?: string };
}

export async function createStudio(
  _prevState: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = studioInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const data = enforceBtoneExclusion(parsed.data);
  const supabase = await createClient();
  const { error } = await supabase.from("studios").insert({
    ...data,
    booking_platform_source: data.booking_platform ? "manual" : "auto",
  } satisfies StudioInsert);

  if (error) return { error: error.message, success: false };

  revalidatePath("/prospects");
  return { error: null, success: true };
}

export async function updateStudio(
  id: string,
  _prevState: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = studioInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: false,
    };
  }

  const data = enforceBtoneExclusion(parsed.data);
  const supabase = await createClient();
  const { error } = await supabase
    .from("studios")
    .update({
      ...data,
      booking_platform_source: data.booking_platform ? "manual" : "auto",
    })
    .eq("id", id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/prospects");
  return { error: null, success: true };
}

export async function deleteStudio(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("studios").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/prospects");
  return { error: null };
}

// ---------------------------------------------------------------------------
// CSV import
// ---------------------------------------------------------------------------

export interface CsvImportResult {
  error: string | null;
  inserted: number;
  skipped: number;
  skipReasons: string[];
}

const CSV_HEADER_ALIASES: Record<string, string> = {
  studio_name: "name",
  studio: "name",
  neighbourhood: "neighborhood",
  instagram: "instagram_handle",
  handle: "instagram_handle",
};

export async function importStudiosFromCsv(
  _prevState: CsvImportResult,
  formData: FormData,
): Promise<CsvImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "Choose a CSV file first.",
      inserted: 0,
      skipped: 0,
      skipReasons: [],
    };
  }

  const text = await file.text();
  const parsedCsv = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => {
      const key = h.trim().toLowerCase().replace(/\s+/g, "_");
      return CSV_HEADER_ALIASES[key] ?? key;
    },
  });

  if (parsedCsv.errors.length > 0) {
    return {
      error: `Couldn't parse that CSV: ${parsedCsv.errors[0].message}`,
      inserted: 0,
      skipped: 0,
      skipReasons: [],
    };
  }

  const rows = parsedCsv.data;
  if (rows.length === 0) {
    return {
      error: "That CSV had no rows to import.",
      inserted: 0,
      skipped: 0,
      skipReasons: [],
    };
  }

  const supabase = await createClient();
  const { data: franchiseBrands } = await supabase
    .from("franchise_brands")
    .select("brand_name, match_patterns");

  const toInsert: StudioInsert[] = [];
  const skipReasons: string[] = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for header row, +1 for 1-indexing
    if (!row.name || !row.name.trim()) {
      skipReasons.push(`Row ${rowNum}: missing name`);
      return;
    }

    // Only auto-detect franchise status if the CSV didn't say one way or
    // the other — an explicit column value is respected (except btone,
    // which is never overridable).
    const csvStatedFranchise =
      row.is_franchise !== undefined && row.is_franchise.trim() !== "";
    const detected = detectFranchiseFromDb(row.name, franchiseBrands ?? []);

    const candidate = {
      ...row,
      is_franchise: csvStatedFranchise
        ? row.is_franchise
        : String(detected.isFranchise),
      franchise_brand: csvStatedFranchise
        ? row.franchise_brand
        : (detected.franchiseBrand ?? undefined),
    };

    const parsed = studioInputSchema.safeParse(candidate);
    if (!parsed.success) {
      skipReasons.push(
        `Row ${rowNum} (${row.name}): ${parsed.error.issues[0]?.message ?? "invalid"}`,
      );
      return;
    }

    // btone is never overridable, even if the CSV explicitly said otherwise.
    const final = enforceBtoneExclusion(parsed.data);

    toInsert.push({
      ...final,
      booking_platform_source: final.booking_platform ? "manual" : "auto",
    });
  });

  if (toInsert.length === 0) {
    return {
      error: null,
      inserted: 0,
      skipped: skipReasons.length,
      skipReasons,
    };
  }

  const { error, count } = await supabase
    .from("studios")
    .insert(toInsert, { count: "exact" });

  if (error) {
    return {
      error: `Rows were valid but the import failed: ${error.message}`,
      inserted: 0,
      skipped: skipReasons.length,
      skipReasons,
    };
  }

  revalidatePath("/prospects");
  return {
    error: null,
    inserted: count ?? toInsert.length,
    skipped: skipReasons.length,
    skipReasons,
  };
}

// ---------------------------------------------------------------------------
// Google Places sync
// ---------------------------------------------------------------------------

export interface PlacesSyncResult {
  error: string | null;
  added: number;
  skippedExisting: number;
  skippedFranchise: number;
  queriesRun: number;
}

/** Runs async tasks with limited concurrency so we don't fire 40+ requests
 * at Google simultaneously. */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export async function syncFromGooglePlaces(
  neighborhoodValues: string[],
  categoryValues: string[],
): Promise<PlacesSyncResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      error:
        "GOOGLE_PLACES_API_KEY isn't set in .env.local yet — see .env.example for where to get one.",
      added: 0,
      skippedExisting: 0,
      skippedFranchise: 0,
      queriesRun: 0,
    };
  }

  const neighborhoods = CHARLESTON_NEIGHBORHOODS.filter((n) =>
    neighborhoodValues.includes(n.dbValue),
  );
  const categories = STUDIO_CATEGORIES.filter((c) =>
    categoryValues.includes(c.dbValue),
  );
  if (neighborhoods.length === 0 || categories.length === 0) {
    return {
      error: "Pick at least one neighborhood and one category to search.",
      added: 0,
      skippedExisting: 0,
      skippedFranchise: 0,
      queriesRun: 0,
    };
  }

  // One query per (neighborhood query string × category), e.g.
  // "pilates studio in Downtown Charleston SC".
  const tasks: { dbNeighborhood: string; dbCategory: string; query: string }[] = [];
  for (const n of neighborhoods) {
    for (const c of categories) {
      for (const q of n.queries) {
        tasks.push({
          dbNeighborhood: n.dbValue,
          dbCategory: c.dbValue,
          query: `${c.query} in ${q}`,
        });
      }
    }
  }

  let fetchError: string | null = null;
  const searchResults = await runWithConcurrency(
    tasks.map((t) => async () => {
      try {
        const results = await searchText(t.query, apiKey);
        return results.map((r) => ({
          ...r,
          dbNeighborhood: t.dbNeighborhood,
          dbCategory: t.dbCategory,
        }));
      } catch (e) {
        fetchError = e instanceof Error ? e.message : "Places search failed";
        return [];
      }
    }),
    6,
  );

  // Dedupe by place_id — the same studio often turns up under multiple
  // category/neighborhood queries.
  const byPlaceId = new Map<string, (typeof searchResults)[number][number]>();
  for (const result of searchResults.flat()) {
    if (!byPlaceId.has(result.placeId)) byPlaceId.set(result.placeId, result);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("studios")
    .select("google_place_id")
    .not("google_place_id", "is", null);
  const existingIds = new Set((existing ?? []).map((s) => s.google_place_id));

  const { data: franchiseBrands } = await supabase
    .from("franchise_brands")
    .select("brand_name, match_patterns");

  let skippedExisting = 0;
  let skippedFranchise = 0;
  const toInsert: StudioInsert[] = [];

  for (const place of byPlaceId.values()) {
    if (existingIds.has(place.placeId)) {
      skippedExisting++;
      continue;
    }
    const detected = detectFranchiseFromDb(place.name, franchiseBrands ?? []);
    if (detected.isFranchise) {
      skippedFranchise++;
      // Still recorded, just flagged — so Chris can see what got excluded
      // and why, rather than it silently vanishing.
    }
    toInsert.push({
      name: place.name,
      address: place.formattedAddress || undefined,
      phone: place.phoneNumber,
      website: place.website,
      rating: place.rating,
      review_count: place.userRatingCount,
      google_place_id: place.placeId,
      neighborhood: place.dbNeighborhood,
      category: place.dbCategory,
      is_franchise: detected.isFranchise,
      franchise_brand: detected.franchiseBrand ?? undefined,
      booking_platform_source: "auto",
      pipeline_stage: "researched",
    });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("studios").insert(toInsert);
    if (error) {
      return {
        error: `Found ${toInsert.length} new studios but saving them failed: ${error.message}`,
        added: 0,
        skippedExisting,
        skippedFranchise,
        queriesRun: tasks.length,
      };
    }
  }

  revalidatePath("/prospects");
  return {
    error: fetchError,
    added: toInsert.length,
    skippedExisting,
    skippedFranchise,
    queriesRun: tasks.length,
  };
}
