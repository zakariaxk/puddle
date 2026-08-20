import { afterEach, describe, expect, it, vi } from "vitest";

import { clearWeatherCache, getNwsWeatherSnapshot } from "../../lib/weather/nws";

const point = { properties: { observationStations: "https://example.test/stations", forecastGridData: "https://example.test/grid" } };
const stations = { features: [{ id: "https://example.test/stations/KMLB", properties: { stationIdentifier: "KMLB" } }] };
const observation = { geometry: { coordinates: [-80.6081, 28.1028] }, properties: { timestamp: "2026-08-19T16:00:00+00:00", temperature: { value: 29.4 }, dewpoint: { value: 23.2 }, relativeHumidity: { value: 69 }, windSpeed: { value: 12 }, precipitationLastHour: { value: 0.3 } } };
const grid = { properties: { updateTime: "2026-08-19T15:45:00+00:00", quantitativePrecipitation: { values: [{ validTime: "2026-08-19T16:00:00+00:00/PT1H", value: 1.7 }] } } };

function fetchFixture(overrides: Record<string, Response> = {}) {
  return vi.fn(async (url: string) => overrides[url] ?? new Response(JSON.stringify(
    url.includes("/points/") ? point : url.endsWith("/stations") ? stations : url.endsWith("latest") ? observation : grid,
  ), { status: 200 })) as unknown as typeof fetch;
}

afterEach(() => clearWeatherCache());

describe("NWS weather provider", () => {
  it("normalizes live-source shapes with source timestamps and attribution", async () => {
    const result = await getNwsWeatherSnapshot(28.0836, -80.6081, fetchFixture());
    expect(result.status).toBe("complete");
    expect(result.cache.status).toBe("miss");
    expect(result.observation).toMatchObject({ stationId: "KMLB", temperatureC: 29.4, observedAt: "2026-08-19T16:00:00.000Z" });
    expect(result.model?.precipitation).toEqual([{ validFrom: "2026-08-19T16:00:00.000Z", validTo: "2026-08-19T17:00:00.000Z", quantitativePrecipitationMm: 1.7 }]);
    expect(result.health).toEqual(expect.arrayContaining([expect.objectContaining({ provider: "National Weather Service", kind: "observation", status: "available" }), expect.objectContaining({ dataset: "National Digital Forecast Database", kind: "model", status: "available" })]));
  });

  it("caches a normalized Central Florida response", async () => {
    const fetcher = fetchFixture();
    await getNwsWeatherSnapshot(28.0836, -80.6081, fetcher);
    const second = await getNwsWeatherSnapshot(28.0836, -80.6081, fetcher);
    expect(second.cache.status).toBe("hit");
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("returns available model guidance when station observations fail", async () => {
    const result = await getNwsWeatherSnapshot(28.0836, -80.6081, fetchFixture({ "https://example.test/stations/KMLB/observations/latest": new Response("unavailable", { status: 503 }) }));
    expect(result.status).toBe("degraded");
    expect(result.model?.precipitation).toHaveLength(1);
    expect(result.observation).toBeNull();
    expect(result.message).toMatch(/reduced/i);
    expect(result.health.find((source) => source.id === "nws-observations")?.status).toBe("unavailable");
  });

  it("treats a timed-out model request as a degraded response", async () => {
    const fetcher = vi.fn();
    fetcher.mockImplementation(async (url: string) => {
      if (url === "https://example.test/grid") throw new Error("timed out");
      return url.includes("/points/") ? new Response(JSON.stringify(point)) : url.endsWith("/stations") ? new Response(JSON.stringify(stations)) : new Response(JSON.stringify(observation));
    });
    const result = await getNwsWeatherSnapshot(28.0836, -80.6081, fetcher as unknown as typeof fetch);
    expect(result.status).toBe("degraded");
    expect(result.health.find((source) => source.id === "nws-ndfd")?.message).toMatch(/could not be reached/i);
  });

  it("rejects malformed model payloads and out-of-region requests", async () => {
    await expect(getNwsWeatherSnapshot(25, -80, fetchFixture())).rejects.toThrow("Central Florida");
    const malformedGrid = new Response(JSON.stringify({ properties: { quantitativePrecipitation: { values: [{ validTime: "broken", value: 1 }] } } }));
    const result = await getNwsWeatherSnapshot(28.0836, -80.6081, fetchFixture({ "https://example.test/grid": malformedGrid }));
    expect(result.status).toBe("degraded");
    expect(result.health.find((source) => source.id === "nws-ndfd")?.status).toBe("unavailable");
  });
});
