import { describe, expect, it } from "vitest";

import { buildHistoricalDataset, measurableRainThresholdMm, type HistoricalDatasetInput } from "../../lib/historical-dataset";

const input: HistoricalDatasetInput = {
  snapshots: [{
    id: "melbourne-1", issuedAt: "2026-08-20T12:00:00.000Z", availableAt: "2026-08-20T11:59:00.000Z",
    location: { latitude: 28.0836, longitude: -80.6081 }, targetStart: "2026-08-20T12:00:00.000Z", targetEnd: "2026-08-20T13:00:00.000Z",
    nwsProbabilityPercent: 60, hrrrPrecipitationMm: 1.5, features: { radarDistanceKm: 4.2 }, sourceIds: ["hrrr-20260820-11", "nws-20260820-1159"],
  }],
  observations: [{
    id: "outcome-1", observedAt: "2026-08-20T12:30:00.000Z", availableAt: "2026-08-20T12:35:00.000Z",
    location: { latitude: 28.09, longitude: -80.61 }, precipitationMm: 0.2, sourceId: "nws-KMLB-1230",
  }],
};

describe("historical dataset", () => {
  it("builds deterministic Central Florida examples with traceable reference baselines", () => {
    const first = buildHistoricalDataset(input, "2026-08-21T00:00:00.000Z");
    const second = buildHistoricalDataset(input, "2026-08-21T00:00:00.000Z");
    expect(first).toEqual(second);
    expect(first.rows[0]).toMatchObject({
      dataAsOf: "2026-08-20T11:59:00.000Z",
      target: { rainObserved: true, precipitationMm: 0.2, sourceId: "nws-KMLB-1230" },
      baselines: { nws: 60, hrrr: 68, equalWeightEnsemble: 64 },
      provenance: { forecastSourceIds: ["hrrr-20260820-11", "nws-20260820-1159"] },
    });
    expect(first.metadata.measurableRainThresholdMm).toBe(measurableRainThresholdMm);
  });

  it("excludes snapshots that could use unavailable-at-issue data and unmatched outcomes", () => {
    const result = buildHistoricalDataset({
      ...input,
      snapshots: [
        ...input.snapshots,
        { ...input.snapshots[0], id: "late-source", availableAt: "2026-08-20T12:01:00.000Z" },
        { ...input.snapshots[0], id: "future-target", issuedAt: "2026-08-20T12:05:00.000Z", availableAt: "2026-08-20T12:04:00.000Z" },
        { ...input.snapshots[0], id: "no-outcome", location: { latitude: 28.8, longitude: -81.7 } },
      ],
    }, "2026-08-21T00:00:00.000Z");
    expect(result.metadata.excluded).toEqual({ futureForecast: 2, outOfBounds: 0, missingOutcome: 1 });
  });

  it("requires a time-windowed nearby observation and keeps baseline probabilities valid", () => {
    const result = buildHistoricalDataset({
      snapshots: [{ ...input.snapshots[0], nwsProbabilityPercent: 140, hrrrPrecipitationMm: 0 }],
      observations: [
        { ...input.observations[0], observedAt: "2026-08-20T11:59:00.000Z" },
        { ...input.observations[0], id: "far", observedAt: "2026-08-20T12:30:00.000Z", location: { latitude: 28.8, longitude: -81.7 } },
      ],
    }, "2026-08-21T00:00:00.000Z");
    expect(result.rows).toEqual([]);

    const bounded = buildHistoricalDataset({ ...input, snapshots: [{ ...input.snapshots[0], nwsProbabilityPercent: 140, hrrrPrecipitationMm: 0 }] }, "2026-08-21T00:00:00.000Z");
    expect(Object.values(bounded.rows[0].baselines).every((value) => value === null || (value >= 0 && value <= 100))).toBe(true);
  });
});
