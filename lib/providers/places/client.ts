/**
 * Thin wrapper around the Google Places API (New) Text Search endpoint.
 * Used by Phase 1's prospect-pull job — not wired into any UI yet, this is
 * just the client so Phase 1 work can call `searchText()` directly.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 * (verify field names there before relying on this — Places API (New) has
 * had field-mask changes across versions.)
 */

export interface PlacesSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  userRatingCount?: number;
  types: string[];
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.types",
].join(",");

/** Shape of the raw Places API (New) response — only the fields we request. */
interface RawPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
}

interface RawPlacesSearchResponse {
  places?: RawPlace[];
}

export async function searchText(
  query: string,
  apiKey: string,
): Promise<PlacesSearchResult[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places searchText failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as RawPlacesSearchResponse;
  const places = data.places ?? [];

  return places.map((p) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "",
    formattedAddress: p.formattedAddress ?? "",
    phoneNumber: p.nationalPhoneNumber,
    website: p.websiteUri,
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    types: p.types ?? [],
  }));
}

/**
 * Charleston-metro neighborhoods to search, one text query per area per
 * studio category. Phase 1 will loop these — defined here so the list
 * lives next to the client that consumes it.
 */
export const CHARLESTON_NEIGHBORHOODS = [
  "Downtown Charleston SC",
  "Mount Pleasant SC",
  "West Ashley Charleston SC",
  "James Island SC",
  "Daniel Island SC",
  "North Charleston SC",
  "Park Circle Charleston SC",
  "Summerville SC",
] as const;

export const STUDIO_CATEGORIES = [
  "pilates studio",
  "yoga studio",
  "barre studio",
  "strength training gym",
  "indoor cycling studio",
  "HIIT gym",
] as const;
