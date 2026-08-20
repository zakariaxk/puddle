import { describe, expect, it } from "vitest";

import { calculateEvaluationMetrics, evaluatePuddleForecasts, validateEvaluationReport } from "../../lib/evaluation";
import type { HistoricalDataset } from "../../lib/historical-dataset";
import type { PuddleModelArtifact } from "../../lib/ml";

const artifact: PuddleModelArtifact = {
  schemaVersion: "phase-9-v1", version: "puddle-evaluation-test-v1", trainedAt: "2026-01-01T00:00:00.000Z",
  trainingData: { schemaVersion: "phase-8-v1", rowCount: 40, firstIssuedAt: "2025-01-01T00:00:00.000Z", lastIssuedAt: "2025-01-31T00:00:00.000Z" },
  featureNames: ["nwsProbabilityPercent"], normalization: { means: [50], standardDeviations: [25] }, logisticRegression: { intercept: 0, coefficients: [1] }, calibration: { method: "platt", intercept: 0, coefficient: 5 }, validation: { rowCount: 12, positiveCount: 6, brierScore: 0.2, baselineBrierScore: 0.3, selected: true },
};

function dataset(): HistoricalDataset {
  return {
    metadata: { schemaVersion: "phase-8-v1", generatedAt: "2026-03-01T00:00:00.000Z", bounds: { west: -81.9, east: -80.1, south: 27.4, north: 29.1 }, measurableRainThresholdMm: 0.1, rowCount: 5, inputSnapshotCount: 5, inputObservationCount: 5, excluded: { futureForecast: 0, outOfBounds: 0, missingOutcome: 0 } },
    rows: [0, 1, 2, 3, 4].map((index) => {
      const probability = [10, 30, 70, 90, 60][index];
      const rain = index >= 2;
      const issuedAt = `2025-02-0${index + 1}T12:00:00.000Z`;
      return { predictionId: `row-${index}`, issuedAt, dataAsOf: issuedAt, location: { latitude: 28, longitude: -81 }, targetStart: issuedAt, targetEnd: "2025-02-01T13:00:00.000Z", target: { rainObserved: rain, precipitationMm: rain ? 1 : 0, observedAt: issuedAt, sourceId: `source-${index}` }, features: { nwsProbabilityPercent: probability, convectiveEvent: index % 2, puddleArrivalMinutes: 10 + index, nwsArrivalMinutes: 15 + index, hrrrArrivalMinutes: 20 + index, equalWeightEnsembleArrivalMinutes: 12 + index, arrivalObservedMinutes: 12 + index }, baselines: { nws: probability, hrrr: probability, equalWeightEnsemble: probability }, provenance: { forecastSourceIds: ["nws", "hrrr"], outcomeSourceId: `source-${index}` } };
    }),
  };
}

describe("forecast evaluation", () => {
  it("calculates Brier score, log loss, reliability, and rank-based ROC-AUC from known probabilities", () => {
    const metrics = calculateEvaluationMetrics([
      { row: dataset().rows[0], probability: 0.1, target: 0 }, { row: dataset().rows[1], probability: 0.9, target: 1 },
    ]);
    expect(metrics).toMatchObject({ sampleCount: 2, positiveCount: 1, brierScore: 0.01, rocAuc: 1 });
    expect(metrics?.logLoss).toBeCloseTo(0.105361, 5);
    expect(metrics?.reliability).toHaveLength(2);
  });

  it("excludes the training window, groups independent metrics, and reports documented missing data", () => {
    const report = evaluatePuddleForecasts(dataset(), artifact, "2026-03-01T00:00:00.000Z");
    expect(report.dataWindow).toMatchObject({ inputRowCount: 5, independentRowCount: 5, excludedOverlappingTrainingRows: 0 });
    expect(report.comparison.commonEligibleSampleCount).toBe(5);
    expect(report.comparison.systems.puddle.metrics?.sampleCount).toBe(5);
    expect(report.comparison.systems.nws.slices.season.find((slice) => slice.name === "winter")?.metrics?.sampleCount).toBe(5);
    expect(report.comparison.systems.puddle.arrival).toEqual({ sampleCount: 5, meanAbsoluteErrorMinutes: 2 });
    expect(validateEvaluationReport(JSON.parse(JSON.stringify(report)))).toBe(true);
  });

  it("does not treat overlapping model-training rows as independent evaluation", () => {
    const overlapping = dataset();
    overlapping.rows[0].issuedAt = "2025-01-15T12:00:00.000Z";
    const report = evaluatePuddleForecasts(overlapping, artifact, "2026-03-01T00:00:00.000Z");
    expect(report.dataWindow).toMatchObject({ independentRowCount: 4, excludedOverlappingTrainingRows: 1 });
  });
});
