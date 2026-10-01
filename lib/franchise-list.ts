/**
 * Known franchise brands, excluded from the pipeline by default because
 * their tech stack is mandated by corporate. This seed list is mirrored
 * into the `franchise_brands` table (see supabase/migrations) where Chris
 * can edit/extend it from the UI — EXCEPT btone, see below.
 */

export interface FranchiseBrand {
  brandName: string;
  /** Lowercase substring(s) matched against a studio's name. */
  matchPatterns: string[];
  /** If true, this entry can't be removed or disabled from the UI. */
  alwaysExclude: boolean;
}

export const FRANCHISE_BRANDS: FranchiseBrand[] = [
  {
    brandName: "btone FITNESS",
    matchPatterns: ["btone"],
    alwaysExclude: true, // Chris works here — hard conflict of interest, never remove this entry.
  },
  { brandName: "Barry's", matchPatterns: ["barry's", "barrys"], alwaysExclude: false },
  { brandName: "BODYROK", matchPatterns: ["bodyrok"], alwaysExclude: false },
  { brandName: "Peach Lab", matchPatterns: ["peach lab"], alwaysExclude: false },
  { brandName: "Jane DO", matchPatterns: ["jane do"], alwaysExclude: false },
  { brandName: "Club Pilates", matchPatterns: ["club pilates"], alwaysExclude: false },
  { brandName: "Pure Barre", matchPatterns: ["pure barre"], alwaysExclude: false },
  { brandName: "Orangetheory", matchPatterns: ["orangetheory"], alwaysExclude: false },
  { brandName: "F45", matchPatterns: ["f45"], alwaysExclude: false },
  { brandName: "CycleBar", matchPatterns: ["cyclebar"], alwaysExclude: false },
  { brandName: "YogaSix", matchPatterns: ["yogasix", "yoga six"], alwaysExclude: false },
  { brandName: "HOTWORX", matchPatterns: ["hotworx"], alwaysExclude: false },
  { brandName: "Fly Dance Fitness", matchPatterns: ["fly dance fitness"], alwaysExclude: false },
  { brandName: "MADabolic", matchPatterns: ["madabolic"], alwaysExclude: false },
  { brandName: "StretchLab", matchPatterns: ["stretchlab"], alwaysExclude: false },
  { brandName: "Rumble", matchPatterns: ["rumble"], alwaysExclude: false },
  { brandName: "[solidcore]", matchPatterns: ["solidcore"], alwaysExclude: false },
];

/** Hard rule, enforced in code in addition to the DB flag: never show btone. */
export function isAlwaysExcluded(studioName: string): boolean {
  const name = studioName.toLowerCase();
  return FRANCHISE_BRANDS.filter((b) => b.alwaysExclude).some((b) =>
    b.matchPatterns.some((p) => name.includes(p)),
  );
}

/** Returns the matched franchise brand name, or null if independent. */
export function detectFranchise(
  studioName: string,
  brands: FranchiseBrand[] = FRANCHISE_BRANDS,
): string | null {
  const name = studioName.toLowerCase();
  for (const brand of brands) {
    if (brand.matchPatterns.some((p) => name.includes(p))) {
      return brand.brandName;
    }
  }
  return null;
}
