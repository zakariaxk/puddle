import { describe, expect, it } from "vitest";

import { isCentralFloridaCoordinate, normalizeGeocodingResults } from "../../lib/location";

describe("location normalization", () => {
  it("keeps valid Central Florida provider results in a shared shape", () => {
    expect(normalizeGeocodingResults([{ place_id: 1, display_name: "Melbourne Beach, Florida", lat: "28.0683", lon: "-80.5603" }]))
      .toEqual([{ id: "1", name: "Melbourne Beach, Florida", latitude: 28.0683, longitude: -80.5603 }]);
  });

  it("rejects malformed and out-of-region coordinates", () => {
    expect(normalizeGeocodingResults([
      { display_name: "Broken", lat: "nope", lon: "-80.5" },
      { display_name: "Miami", lat: "25.7617", lon: "-80.1918" },
    ])).toEqual([]);
    expect(isCentralFloridaCoordinate(28.5, -81.4)).toBe(true);
    expect(isCentralFloridaCoordinate(30, -81.4)).toBe(false);
  });
});
