import { normalizeGeocodingResults, type GeocodingResult } from "./location";

const cache = new Map<string, { expiresAt: number; results: GeocodingResult[] }>();
const cacheDurationMs = 1000 * 60 * 60 * 24;

export class GeocodingError extends Error {}

export async function searchCentralFloridaLocations(query: string): Promise<GeocodingResult[]> {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");

  if (normalizedQuery.length < 2) {
    throw new GeocodingError("Enter at least two characters to search Central Florida.");
  }

  const cacheKey = normalizedQuery.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  let response: Response;
  try {
    response = await fetch("https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
      q: normalizedQuery,
      format: "jsonv2",
      addressdetails: "1",
      limit: "6",
      bounded: "1",
      viewbox: "-82.05,29.2,-80.35,27.45",
    }), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Puddle location search (development)",
      },
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    throw new GeocodingError("Location search is temporarily unavailable. Try again in a moment.");
  }

  if (!response.ok) {
    throw new GeocodingError("Location search is temporarily unavailable. Try again in a moment.");
  }

  const results = normalizeGeocodingResults(await response.json());
  cache.set(cacheKey, { expiresAt: Date.now() + cacheDurationMs, results });
  return results;
}
