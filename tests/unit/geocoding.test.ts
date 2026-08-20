import { afterEach, describe, expect, it, vi } from "vitest";

import { searchCentralFloridaLocations } from "../../lib/geocoding";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Central Florida location search", () => {
  it("keeps the user's place name intact while constraining Nominatim to Central Florida", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { place_id: 1, display_name: "Melbourne Beach, Florida", lat: "28.0683", lon: "-80.5603" },
    ])));
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchCentralFloridaLocations("Melbourne Beach")).resolves.toEqual([
      { id: "1", name: "Melbourne Beach, Florida", latitude: 28.0683, longitude: -80.5603 },
    ]);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("q")).toBe("Melbourne Beach");
    expect(url.searchParams.get("bounded")).toBe("1");
    expect(url.searchParams.get("viewbox")).toBe("-82.05,29.2,-80.35,27.45");
  });
});
