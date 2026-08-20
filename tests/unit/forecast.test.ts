import { describe, expect, it } from "vitest";

import { createConsumerForecast } from "../../lib/forecast";
import type { WeatherSnapshot } from "../../lib/weather/types";

const snapshot: WeatherSnapshot = {
  location: { latitude: 28.0836, longitude: -80.6081 }, fetchedAt: "2026-08-20T12:00:00.000Z", cache: { status: "miss", expiresAt: "2026-08-20T12:05:00.000Z" }, status: "complete", message: "Live sources are available.",
  health: [
    { id: "nws-observations", provider: "National Weather Service", dataset: "NWS station observation", kind: "observation", status: "available", fetchedAt: "2026-08-20T12:00:00.000Z", sourceTimestamp: "2026-08-20T11:55:00.000Z" },
    { id: "nws-ndfd", provider: "National Weather Service", dataset: "National Digital Forecast Database", kind: "model", status: "available", fetchedAt: "2026-08-20T12:00:00.000Z", sourceTimestamp: "2026-08-20T12:00:00.000Z" },
  ],
  observation: { stationId: "KMLB", observedAt: "2026-08-20T11:55:00.000Z", latitude: 28.1, longitude: -80.6, temperatureC: 29, dewpointC: 23, relativeHumidityPercent: 70, windSpeedKph: 10, precipitationLastHourMm: 0 },
  model: { model: "NWS National Digital Forecast Database", updatedAt: "2026-08-20T12:00:00.000Z", precipitation: [
    { validFrom: "2026-08-20T12:00:00.000Z", validTo: "2026-08-20T13:00:00.000Z", quantitativePrecipitationMm: 2, probabilityPercent: 60 },
    { validFrom: "2026-08-20T13:00:00.000Z", validTo: "2026-08-20T14:00:00.000Z", quantitativePrecipitationMm: 0, probabilityPercent: 10 },
  ] },
};

describe("consumer forecast", () => {
  it("returns bounded, typed horizons with an honest model-window arrival", () => {
    const result = createConsumerForecast(snapshot, Date.parse("2026-08-20T12:00:00.000Z"));
    expect(result.horizons.map((horizon) => horizon.minutes)).toEqual([15, 30, 60, 120, 360]);
    expect(result.horizons.every((horizon) => horizon.probabilityPercent >= 0 && horizon.probabilityPercent <= 100)).toBe(true);
    expect(result.horizons.find((horizon) => horizon.minutes === 60)).toMatchObject({ probabilityPercent: 60, intensity: "light", arrival: expect.stringContaining("8:00") });
    expect(result.confidence).toBe("high");
    expect(result.why.join(" ")).toMatch(/not a trained Puddle model/i);
  });

  it("reduces confidence for degraded or stale inputs without inventing a forecast when model guidance is missing", () => {
    const degraded = createConsumerForecast({ ...snapshot, status: "degraded", observation: null }, Date.parse("2026-08-20T14:00:00.000Z"));
    expect(degraded).toMatchObject({ status: "degraded", confidence: "low" });
    const unavailable = createConsumerForecast({ ...snapshot, model: null, status: "degraded" });
    expect(unavailable).toMatchObject({ status: "unavailable", confidence: "low", horizons: [] });
  });

  it("does not invent a minimum rain chance when live guidance is dry", () => {
    const dry = createConsumerForecast({
      ...snapshot,
      model: { ...snapshot.model!, precipitation: [{ validFrom: "2026-08-20T12:00:00.000Z", validTo: "2026-08-20T13:00:00.000Z", quantitativePrecipitationMm: 0, probabilityPercent: null }] },
    }, Date.parse("2026-08-20T12:00:00.000Z"));
    expect(dry.horizons.find((horizon) => horizon.minutes === 60)?.probabilityPercent).toBe(0);
  });
});
