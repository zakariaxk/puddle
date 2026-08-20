import type { HistoricalDataset, HistoricalDatasetRow } from "./historical-dataset";
import type { WeatherSnapshot } from "./weather/types";

export const puddleModelSchemaVersion = "phase-9-v1";
export const puddleModelFeatureNames = ["nwsProbabilityPercent"] as const;
const minimumTrainingRows = 40;
const minimumValidationRows = 12;

export type PuddleModelArtifact = {
  schemaVersion: typeof puddleModelSchemaVersion;
  version: string;
  trainedAt: string;
  trainingData: { schemaVersion: string; rowCount: number; firstIssuedAt: string; lastIssuedAt: string };
  featureNames: typeof puddleModelFeatureNames;
  normalization: { means: number[]; standardDeviations: number[] };
  logisticRegression: { intercept: number; coefficients: number[] };
  calibration: { method: "platt"; intercept: number; coefficient: number };
  validation: { rowCount: number; positiveCount: number; brierScore: number; nwsBrierScore: number; selected: boolean };
};

export type TrainingResult = { artifact: PuddleModelArtifact | null; reason: string; trainingRows: number; validationRows: number };

type TrainingExample = { issuedAt: string; values: number[]; target: number; nwsProbabilityPercent: number };

function clampProbability(value: number) {
  return Math.max(0, Math.min(1, value));
}

function sigmoid(value: number) {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exponent = Math.exp(value);
  return exponent / (1 + exponent);
}

function brierScore(probabilities: number[], targets: number[]) {
  return probabilities.reduce((total, probability, index) => total + (probability - targets[index]) ** 2, 0) / probabilities.length;
}

function numberFeature(row: HistoricalDatasetRow, name: typeof puddleModelFeatureNames[number]) {
  const value = row.features[name];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asTrainingExample(row: HistoricalDatasetRow): TrainingExample | null {
  if (!row.target || Date.parse(row.dataAsOf) > Date.parse(row.issuedAt) || Date.parse(row.issuedAt) > Date.parse(row.targetStart)) return null;
  const values = puddleModelFeatureNames.map((name) => numberFeature(row, name));
  if (values.some((value) => value === null)) return null;
  return { issuedAt: row.issuedAt, values: values as number[], target: row.target.rainObserved ? 1 : 0, nwsProbabilityPercent: values[0] as number };
}

function meansAndStandardDeviations(rows: TrainingExample[]) {
  const means = puddleModelFeatureNames.map((_, index) => rows.reduce((total, row) => total + row.values[index], 0) / rows.length);
  const standardDeviations = means.map((mean, index) => Math.sqrt(rows.reduce((total, row) => total + (row.values[index] - mean) ** 2, 0) / rows.length) || 1);
  return { means, standardDeviations };
}

function normalized(values: number[], normalization: PuddleModelArtifact["normalization"]) {
  return values.map((value, index) => (value - normalization.means[index]) / normalization.standardDeviations[index]);
}

function fitLogistic(rows: TrainingExample[], normalization: PuddleModelArtifact["normalization"], targetForRow: (row: TrainingExample) => number) {
  let intercept = 0;
  const coefficients = puddleModelFeatureNames.map(() => 0);
  const rate = 0.08;
  for (let iteration = 0; iteration < 1_500; iteration += 1) {
    let interceptGradient = 0;
    const coefficientGradients = coefficients.map(() => 0);
    for (const row of rows) {
      const values = normalized(row.values, normalization);
      const prediction = sigmoid(intercept + values.reduce((total, value, index) => total + value * coefficients[index], 0));
      const error = prediction - targetForRow(row);
      interceptGradient += error;
      values.forEach((value, index) => { coefficientGradients[index] += error * value; });
    }
    intercept -= rate * interceptGradient / rows.length;
    coefficients.forEach((_, index) => { coefficients[index] -= rate * coefficientGradients[index] / rows.length; });
  }
  return { intercept, coefficients };
}

function rawProbability(values: number[], artifact: Pick<PuddleModelArtifact, "normalization" | "logisticRegression">) {
  const normalizedValues = normalized(values, artifact.normalization);
  return sigmoid(artifact.logisticRegression.intercept + normalizedValues.reduce((total, value, index) => total + value * artifact.logisticRegression.coefficients[index], 0));
}

export function calibratedProbability(values: number[], artifact: Pick<PuddleModelArtifact, "normalization" | "logisticRegression" | "calibration">) {
  if (values.length !== puddleModelFeatureNames.length || values.some((value) => !Number.isFinite(value))) return null;
  const raw = rawProbability(values, artifact);
  return clampProbability(sigmoid(artifact.calibration.intercept + artifact.calibration.coefficient * raw));
}

export function trainPuddleModel(dataset: HistoricalDataset, trainedAt: string, version = "puddle-logistic-v1"): TrainingResult {
  if (dataset.metadata.schemaVersion !== "phase-8-v1") return { artifact: null, reason: "The dataset schema is not supported by this trainer.", trainingRows: 0, validationRows: 0 };
  const examples = dataset.rows.map(asTrainingExample).filter((row): row is TrainingExample => row !== null).sort((first, second) => Date.parse(first.issuedAt) - Date.parse(second.issuedAt));
  const validationRows = Math.max(minimumValidationRows, Math.ceil(examples.length * 0.2));
  const trainingRows = examples.length - validationRows;
  if (trainingRows < minimumTrainingRows || validationRows < minimumValidationRows) {
    return { artifact: null, reason: `Need at least ${minimumTrainingRows + minimumValidationRows} eligible time-ordered rows; found ${examples.length}.`, trainingRows: Math.max(0, trainingRows), validationRows: Math.min(examples.length, validationRows) };
  }
  const train = examples.slice(0, trainingRows);
  const validation = examples.slice(trainingRows);
  const normalization = meansAndStandardDeviations(train);
  const logisticRegression = fitLogistic(train, normalization, (row) => row.target);
  const provisional = { normalization, logisticRegression };
  const calibrationRows = train.slice(Math.floor(train.length * 0.8));
  const calibrationInputs = calibrationRows.map((row) => ({ ...row, values: [rawProbability(row.values, provisional)] }));
  const calibration = fitLogistic(calibrationInputs, { means: [0], standardDeviations: [1] }, (row) => row.target);
  const artifact: PuddleModelArtifact = {
    schemaVersion: puddleModelSchemaVersion, version, trainedAt,
    trainingData: { schemaVersion: dataset.metadata.schemaVersion, rowCount: examples.length, firstIssuedAt: train[0].issuedAt, lastIssuedAt: train.at(-1)!.issuedAt },
    featureNames: puddleModelFeatureNames, normalization, logisticRegression,
    calibration: { method: "platt", intercept: calibration.intercept, coefficient: calibration.coefficients[0] },
    validation: { rowCount: validation.length, positiveCount: validation.filter((row) => row.target === 1).length, brierScore: 0, nwsBrierScore: 0, selected: false },
  };
  const modelProbabilities = validation.map((row) => calibratedProbability(row.values, artifact)!);
  const targets = validation.map((row) => row.target);
  artifact.validation.brierScore = brierScore(modelProbabilities, targets);
  artifact.validation.nwsBrierScore = brierScore(validation.map((row) => clampProbability(row.nwsProbabilityPercent / 100)), targets);
  artifact.validation.selected = artifact.validation.positiveCount > 0
    && artifact.validation.positiveCount < validation.length
    && artifact.validation.brierScore < artifact.validation.nwsBrierScore;
  return { artifact: artifact.validation.selected ? artifact : null, reason: artifact.validation.selected ? "Selected: calibrated logistic regression improves held-out Brier score over archived NWS guidance." : "Not selected: the candidate did not improve the held-out Brier score or validation contains one class.", trainingRows, validationRows };
}

export function extractLiveModelFeatures(snapshot: WeatherSnapshot, now = Date.now()) {
  const periods = snapshot.model?.precipitation ?? [];
  const end = now + 60 * 60_000;
  let coveredMilliseconds = 0;
  let weightedProbability = 0;
  for (const period of periods) {
    const overlap = Math.max(0, Math.min(Date.parse(period.validTo), end) - Math.max(Date.parse(period.validFrom), now));
    if (!overlap || period.probabilityPercent === null) continue;
    coveredMilliseconds += overlap;
    weightedProbability += period.probabilityPercent * overlap;
  }
  if (!coveredMilliseconds) return null;
  return [weightedProbability / coveredMilliseconds];
}

export function validatePuddleModelArtifact(value: unknown): value is PuddleModelArtifact {
  if (!value || typeof value !== "object") return false;
  const artifact = value as Partial<PuddleModelArtifact>;
  return artifact.schemaVersion === puddleModelSchemaVersion
    && typeof artifact.version === "string"
    && Array.isArray(artifact.featureNames)
    && artifact.featureNames.length === puddleModelFeatureNames.length
    && artifact.featureNames.every((name, index) => name === puddleModelFeatureNames[index])
    && Boolean(artifact.validation?.selected)
    && Boolean(artifact.normalization?.means?.every(Number.isFinite))
    && Boolean(artifact.normalization?.standardDeviations?.every((value) => Number.isFinite(value) && value > 0))
    && Boolean(artifact.logisticRegression?.coefficients?.every(Number.isFinite))
    && Number.isFinite(artifact.logisticRegression?.intercept)
    && Number.isFinite(artifact.calibration?.intercept)
    && Number.isFinite(artifact.calibration?.coefficient);
}
