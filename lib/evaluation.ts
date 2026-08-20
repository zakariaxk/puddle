import type { HistoricalDataset, HistoricalDatasetRow } from "./historical-dataset.ts";
import { calibratedProbability, type PuddleModelArtifact } from "./ml.ts";

export const evaluationSchemaVersion = "phase-10-v1";

const systems = ["puddle", "nws", "hrrr", "equalWeightEnsemble"] as const;
const epsilon = 1e-15;

export type EvaluationSystem = typeof systems[number];
export type ReliabilityBin = { lowerBoundPercent: number; upperBoundPercent: number; sampleCount: number; meanProbabilityPercent: number; observedRainRatePercent: number };
export type EvaluationMetrics = { sampleCount: number; positiveCount: number; brierScore: number; logLoss: number; rocAuc: number | null; expectedCalibrationError: number; reliability: ReliabilityBin[] };
export type ArrivalMetrics = { sampleCount: number; meanAbsoluteErrorMinutes: number } | null;
export type EvaluationSlice = { name: string; metrics: EvaluationMetrics | null; reason: string | null };
export type SystemEvaluation = { eligibleSampleCount: number; metrics: EvaluationMetrics | null; arrival: ArrivalMetrics; slices: { horizonMinutes: EvaluationSlice[]; season: EvaluationSlice[]; convectiveEvent: EvaluationSlice[] }; reason: string | null };

export type EvaluationReport = {
  schemaVersion: typeof evaluationSchemaVersion;
  generatedAt: string;
  model: { version: string; trainedAt: string; trainingData: PuddleModelArtifact["trainingData"] };
  dataWindow: { firstIssuedAt: string | null; lastIssuedAt: string | null; inputRowCount: number; independentRowCount: number; excludedOverlappingTrainingRows: number; measurableRainThresholdMm: number };
  comparison: { commonEligibleSampleCount: number; systems: Record<EvaluationSystem, SystemEvaluation> };
  limitations: string[];
};

type ProbabilitySample = { row: HistoricalDatasetRow; probability: number; target: number };

function round(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function validProbability(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value / 100 : null;
}

function puddleProbability(row: HistoricalDatasetRow, artifact: PuddleModelArtifact) {
  const values = artifact.featureNames.map((name) => row.features[name]);
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) return null;
  return calibratedProbability(values as number[], artifact);
}

function probabilityFor(row: HistoricalDatasetRow, system: EvaluationSystem, artifact: PuddleModelArtifact) {
  if (system === "puddle") return puddleProbability(row, artifact);
  return validProbability(row.baselines[system]);
}

function auc(samples: ProbabilitySample[]) {
  const positives = samples.filter((sample) => sample.target === 1).length;
  const negatives = samples.length - positives;
  if (!positives || !negatives) return null;
  const sorted = [...samples].sort((a, b) => a.probability - b.probability);
  let positiveRankSum = 0;
  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].probability === sorted[start].probability) end += 1;
    const averageRank = (start + 1 + end) / 2;
    for (let index = start; index < end; index += 1) if (sorted[index].target === 1) positiveRankSum += averageRank;
    start = end;
  }
  return round((positiveRankSum - positives * (positives + 1) / 2) / (positives * negatives));
}

export function calculateEvaluationMetrics(samples: ProbabilitySample[]): EvaluationMetrics | null {
  if (!samples.length) return null;
  const positiveCount = samples.filter((sample) => sample.target === 1).length;
  const reliability = Array.from({ length: 10 }, (_, index) => {
    const lower = index / 10;
    const upper = (index + 1) / 10;
    const bin = samples.filter((sample) => index === 9 ? sample.probability >= lower && sample.probability <= upper : sample.probability >= lower && sample.probability < upper);
    if (!bin.length) return null;
    const meanProbability = bin.reduce((total, sample) => total + sample.probability, 0) / bin.length;
    const observedRate = bin.reduce((total, sample) => total + sample.target, 0) / bin.length;
    return { lowerBoundPercent: lower * 100, upperBoundPercent: upper * 100, sampleCount: bin.length, meanProbabilityPercent: round(meanProbability * 100), observedRainRatePercent: round(observedRate * 100) };
  }).filter((bin): bin is ReliabilityBin => bin !== null);
  const brierScore = samples.reduce((total, sample) => total + (sample.probability - sample.target) ** 2, 0) / samples.length;
  const logLoss = samples.reduce((total, sample) => {
    const probability = Math.max(epsilon, Math.min(1 - epsilon, sample.probability));
    return total - (sample.target * Math.log(probability) + (1 - sample.target) * Math.log(1 - probability));
  }, 0) / samples.length;
  const expectedCalibrationError = reliability.reduce((total, bin) => total + bin.sampleCount / samples.length * Math.abs(bin.meanProbabilityPercent - bin.observedRainRatePercent) / 100, 0);
  return { sampleCount: samples.length, positiveCount, brierScore: round(brierScore), logLoss: round(logLoss), rocAuc: auc(samples), expectedCalibrationError: round(expectedCalibrationError), reliability };
}

function samplesFor(rows: HistoricalDatasetRow[], system: EvaluationSystem, artifact: PuddleModelArtifact) {
  return rows.flatMap((row) => {
    const probability = probabilityFor(row, system, artifact);
    return probability === null || !row.target ? [] : [{ row, probability, target: row.target.rainObserved ? 1 : 0 }];
  });
}

function slice(name: string, rows: HistoricalDatasetRow[], system: EvaluationSystem, artifact: PuddleModelArtifact): EvaluationSlice {
  const metrics = calculateEvaluationMetrics(samplesFor(rows, system, artifact));
  return { name, metrics, reason: metrics ? null : "No eligible predictions and verified outcomes were available for this slice." };
}

function arrivalFor(rows: HistoricalDatasetRow[], system: EvaluationSystem): ArrivalMetrics {
  const predictedKey = `${system}ArrivalMinutes`;
  const errors = rows.flatMap((row) => {
    const predicted = row.features[predictedKey];
    const observed = row.features.arrivalObservedMinutes;
    return typeof predicted === "number" && Number.isFinite(predicted) && typeof observed === "number" && Number.isFinite(observed) ? [Math.abs(predicted - observed)] : [];
  });
  if (!errors.length) return null;
  return { sampleCount: errors.length, meanAbsoluteErrorMinutes: round(errors.reduce((total, error) => total + error, 0) / errors.length) };
}

function seasonFor(issuedAt: string) {
  const month = new Date(issuedAt).getUTCMonth();
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "fall";
}

function evaluateSystem(rows: HistoricalDatasetRow[], system: EvaluationSystem, artifact: PuddleModelArtifact): SystemEvaluation {
  const eligible = samplesFor(rows, system, artifact);
  const metrics = calculateEvaluationMetrics(eligible);
  const horizons = [...new Set(rows.map((row) => Math.round((Date.parse(row.targetEnd) - Date.parse(row.targetStart)) / 60_000)))].sort((a, b) => a - b);
  const seasons = ["winter", "spring", "summer", "fall"];
  return {
    eligibleSampleCount: eligible.length,
    metrics,
    arrival: arrivalFor(rows, system),
    slices: {
      horizonMinutes: horizons.map((minutes) => slice(`${minutes}m`, rows.filter((row) => Math.round((Date.parse(row.targetEnd) - Date.parse(row.targetStart)) / 60_000) === minutes), system, artifact)),
      season: seasons.map((season) => slice(season, rows.filter((row) => seasonFor(row.issuedAt) === season), system, artifact)),
      convectiveEvent: [slice("convective", rows.filter((row) => row.features.convectiveEvent === 1), system, artifact), slice("non-convective", rows.filter((row) => row.features.convectiveEvent === 0), system, artifact)],
    },
    reason: metrics ? null : "No eligible predictions and verified outcomes were available for this system.",
  };
}

export function evaluatePuddleForecasts(dataset: HistoricalDataset, artifact: PuddleModelArtifact, generatedAt: string): EvaluationReport {
  const trainingEnd = Date.parse(artifact.trainingData.lastIssuedAt);
  const independentRows = dataset.rows.filter((row) => Date.parse(row.issuedAt) > trainingEnd);
  const orderedRows = [...independentRows].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
  const reportSystems = Object.fromEntries(systems.map((system) => [system, evaluateSystem(orderedRows, system, artifact)])) as Record<EvaluationSystem, SystemEvaluation>;
  const commonEligibleSampleCount = orderedRows.filter((row) => systems.every((system) => probabilityFor(row, system, artifact) !== null && row.target !== null)).length;
  const limitations = [
    "Only forecasts issued after the model training window are included, preventing training-data results from being presented as independent evaluation.",
    "ROC-AUC is secondary and is omitted for slices with only one observed outcome class.",
  ];
  if (!orderedRows.some((row) => row.features.convectiveEvent === 0 || row.features.convectiveEvent === 1)) limitations.push("Convective-event slices are unavailable because the dataset has no convective-event labels.");
  if (!orderedRows.some((row) => typeof row.features.arrivalObservedMinutes === "number")) limitations.push("Arrival-time MAE is unavailable because the dataset has no matched arrival observations.");
  if (!commonEligibleSampleCount) limitations.push("No apples-to-apples comparison is available yet: at least one system is missing from every independent verified row.");
  return {
    schemaVersion: evaluationSchemaVersion,
    generatedAt,
    model: { version: artifact.version, trainedAt: artifact.trainedAt, trainingData: artifact.trainingData },
    dataWindow: { firstIssuedAt: orderedRows[0]?.issuedAt ?? null, lastIssuedAt: orderedRows.at(-1)?.issuedAt ?? null, inputRowCount: dataset.rows.length, independentRowCount: orderedRows.length, excludedOverlappingTrainingRows: dataset.rows.length - orderedRows.length, measurableRainThresholdMm: dataset.metadata.measurableRainThresholdMm },
    comparison: { commonEligibleSampleCount, systems: reportSystems },
    limitations,
  };
}

export function validateEvaluationReport(value: unknown): value is EvaluationReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<EvaluationReport>;
  return report.schemaVersion === evaluationSchemaVersion
    && typeof report.generatedAt === "string"
    && typeof report.model?.version === "string"
    && typeof report.dataWindow?.inputRowCount === "number"
    && typeof report.comparison?.commonEligibleSampleCount === "number"
    && Array.isArray(report.limitations);
}
