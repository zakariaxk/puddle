import { describe, expect, it } from "vitest";

import type { ConsumerForecast } from "../../lib/forecast";
import type { HistoricalDataset } from "../../lib/historical-dataset";
import { applyPuddleModel } from "../../lib/ml-inference";
import { calibratedProbability, extractLiveModelFeatures, trainPuddleModel, validatePuddleModelArtifact } from "../../lib/ml";
import type { WeatherSnapshot } from "../../lib/weather/types";

function dataset(rows = 80): HistoricalDataset {
  return {
    metadata: { schemaVersion: "phase-8-v1", generatedAt: "2026-08-21T00:00:00.000Z", bounds: { west: -81.9, east: -80.1, south: 27.4, north: 29.1 }, measurableRainThresholdMm: 0.1, rowCount: rows, inputSnapshotCount: rows, inputObservationCount: rows, excluded: { futureForecast: 0, outOfBounds: 0, missingOutcome: 0 } },
    rows: Array.from({ length: rows }, (_, index) => {
      const probability = index % 2 ? 90 : 10;
      const issuedAt = new Date(Date.parse("2026-05-01T00:00:00.000Z") + index * 60 * 60_000).toISOString();
      const targetStart = new Date(Date.parse(issuedAt) + 60_000).toISOString();
      return {
        predictionId: `row-${index}`, issuedAt, dataAsOf: issuedAt, location: { latitude: 28, longitude: -81 }, targetStart, targetEnd: new Date(Date.parse(targetStart) + 60 * 60_000).toISOString(),
        target: { rainObserved: probability > 50, precipitationMm: probability > 50 ? 1 : 0, observedAt: targetStart, sourceId: `station-${index}` },
        features: { nwsProbabilityPercent: probability }, baselines: { nws: probability, hrrr: null, equalWeightEnsemble: null }, provenance: { forecastSourceIds: ["nws"], outcomeSourceId: `station-${index}` },
      };
    }),
  };
}

const snapshot: WeatherSnapshot = {
  location: { latitude: 28, longitude: -81 }, fetchedAt: "2026-08-20T12:00:00.000Z", cache: { status: "miss", expiresAt: "2026-08-20T12:05:00.000Z" }, status: "complete", message: "Live sources are available.", health: [], observation: null,
  model: { model: "NWS National Digital Forecast Database", updatedAt: "2026-08-20T12:00:00.000Z", precipitation: [{ validFrom: "2026-08-20T12:00:00.000Z", validTo: "2026-08-20T13:00:00.000Z", quantitativePrecipitationMm: 1, probabilityPercent: 60 }] },
};

const forecast: ConsumerForecast = {
  location: snapshot.location, generatedAt: "2026-08-20T12:00:00.000Z", fetchedAt: snapshot.fetchedAt, status: "available", message: "Available", confidence: "high", modelVersion: "nws-guidance-v1", sources: [], why: ["Provider guidance"],
  horizons: [{ minutes: 15, probabilityPercent: 20, intensity: "none", arrival: null }, { minutes: 30, probabilityPercent: 30, intensity: "none", arrival: null }, { minutes: 60, probabilityPercent: 60, intensity: "light", arrival: null }, { minutes: 120, probabilityPercent: 50, intensity: "light", arrival: null }, { minutes: 360, probabilityPercent: 40, intensity: "light", arrival: null }],
};

describe("Puddle model", () => {
  it("uses a time-ordered split, records calibrated validation, and serializes a selected model", () => {
    const result = trainPuddleModel(dataset(), "2026-08-21T00:00:00.000Z");
    expect(result.artifact).not.toBeNull();
    expect(result.artifact?.validation).toMatchObject({ rowCount: 16, positiveCount: 8, selected: true });
    expect(result.artifact?.validation.brierScore).toBeLessThan(result.artifact?.validation.nwsBrierScore ?? 1);
    expect(validatePuddleModelArtifact(JSON.parse(JSON.stringify(result.artifact)))).toBe(true);
  });

  it("rejects undersized training data and rows with future-as-of inputs", () => {
    expect(trainPuddleModel(dataset(51), "2026-08-21T00:00:00.000Z").artifact).toBeNull();
    const invalid = dataset();
    invalid.rows[0].dataAsOf = "2026-06-01T00:00:00.000Z";
    expect(trainPuddleModel(invalid, "2026-08-21T00:00:00.000Z").trainingRows).toBe(63);
  });

  it("shares the NWS feature contract with inference and falls back when a feature is unavailable", () => {
    const artifact = trainPuddleModel(dataset(), "2026-08-21T00:00:00.000Z").artifact!;
    expect(extractLiveModelFeatures(snapshot, Date.parse("2026-08-20T12:00:00.000Z"))).toEqual([60]);
    expect(calibratedProbability([60], artifact)).toBeGreaterThanOrEqual(0);
    const applied = applyPuddleModel(forecast, snapshot, artifact, Date.parse("2026-08-20T12:00:00.000Z"));
    expect(applied.modelVersion).toBe(artifact.version);
    expect(applied.horizons.find((horizon) => horizon.minutes === 60)?.probabilityPercent).not.toBe(60);
    expect(applyPuddleModel(forecast, { ...snapshot, model: null }, artifact)).toEqual(forecast);
  });
});
