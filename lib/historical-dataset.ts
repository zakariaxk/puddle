export const centralFloridaBounds = {
  west: -81.9,
  east: -80.1,
  south: 27.4,
  north: 29.1,
} as const;

export const measurableRainThresholdMm = 0.1;
export const datasetSchemaVersion = "phase-8-v1";

export type HistoricalLocation = { latitude: number; longitude: number };

export type HistoricalForecastSnapshot = {
  id: string;
  issuedAt: string;
  availableAt: string;
  location: HistoricalLocation;
  nwsProbabilityPercent: number | null;
  hrrrPrecipitationMm: number | null;
  targetStart: string;
  targetEnd: string;
  features?: Record<string, number | null>;
  sourceIds: string[];
};

export type HistoricalObservation = {
  id: string;
  observedAt: string;
  availableAt: string;
  location: HistoricalLocation;
  precipitationMm: number | null;
  sourceId: string;
};

export type HistoricalDatasetInput = {
  snapshots: HistoricalForecastSnapshot[];
  observations: HistoricalObservation[];
};

export type BaselineProbabilities = {
  nws: number | null;
  hrrr: number | null;
  equalWeightEnsemble: number | null;
};

export type HistoricalDatasetRow = {
  predictionId: string;
  issuedAt: string;
  dataAsOf: string;
  location: HistoricalLocation;
  targetStart: string;
  targetEnd: string;
  target: { rainObserved: boolean; precipitationMm: number; observedAt: string; sourceId: string } | null;
  features: Record<string, number | null>;
  baselines: BaselineProbabilities;
  provenance: { forecastSourceIds: string[]; outcomeSourceId: string | null };
};

export type HistoricalDataset = {
  metadata: {
    schemaVersion: typeof datasetSchemaVersion;
    generatedAt: string;
    bounds: typeof centralFloridaBounds;
    measurableRainThresholdMm: typeof measurableRainThresholdMm;
    rowCount: number;
    inputSnapshotCount: number;
    inputObservationCount: number;
    excluded: { futureForecast: number; outOfBounds: number; missingOutcome: number };
  };
  rows: HistoricalDatasetRow[];
};

function parseTime(value: string, field: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`${field} must be a valid ISO timestamp.`);
  return time;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function boundedProbability(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, round(value)));
}

function hrrrProbability(precipitationMm: number | null) {
  if (precipitationMm === null || !Number.isFinite(precipitationMm)) return null;
  // HRRR is deterministic guidance; this deliberately maps its predicted amount
  // to a transparent reference probability instead of presenting it as calibrated.
  return boundedProbability(precipitationMm < measurableRainThresholdMm ? 5 : 20 + precipitationMm * 32);
}

function inCentralFlorida(location: HistoricalLocation) {
  return location.longitude >= centralFloridaBounds.west && location.longitude <= centralFloridaBounds.east
    && location.latitude >= centralFloridaBounds.south && location.latitude <= centralFloridaBounds.north;
}

function distanceKm(first: HistoricalLocation, second: HistoricalLocation) {
  const latitudeRadians = Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = (second.latitude - first.latitude) * latitudeRadians;
  const longitudeDelta = (second.longitude - first.longitude) * latitudeRadians;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(first.latitude * latitudeRadians) * Math.cos(second.latitude * latitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchingOutcome(snapshot: HistoricalForecastSnapshot, observations: HistoricalObservation[]) {
  const targetStart = parseTime(snapshot.targetStart, "targetStart");
  const targetEnd = parseTime(snapshot.targetEnd, "targetEnd");
  return observations
    .filter((observation) => {
      const observedAt = parseTime(observation.observedAt, "observedAt");
      return observation.precipitationMm !== null
        && observedAt >= targetStart
        && observedAt <= targetEnd
        && distanceKm(snapshot.location, observation.location) <= 5;
    })
    .sort((first, second) => parseTime(first.observedAt, "observedAt") - parseTime(second.observedAt, "observedAt") || first.id.localeCompare(second.id))
    .at(-1) ?? null;
}

export function buildHistoricalDataset(input: HistoricalDatasetInput, generatedAt: string): HistoricalDataset {
  const buildTime = parseTime(generatedAt, "generatedAt");
  let futureForecast = 0;
  let outOfBounds = 0;
  let missingOutcome = 0;
  const rows: HistoricalDatasetRow[] = [];

  for (const snapshot of [...input.snapshots].sort((first, second) => first.id.localeCompare(second.id))) {
    const issuedAt = parseTime(snapshot.issuedAt, "issuedAt");
    const availableAt = parseTime(snapshot.availableAt, "availableAt");
    const targetStart = parseTime(snapshot.targetStart, "targetStart");
    if (availableAt > issuedAt || issuedAt > targetStart || issuedAt > buildTime) {
      futureForecast += 1;
      continue;
    }
    if (!inCentralFlorida(snapshot.location)) {
      outOfBounds += 1;
      continue;
    }
    const outcome = matchingOutcome(snapshot, input.observations);
    if (!outcome) {
      missingOutcome += 1;
      continue;
    }
    const precipitationMm = outcome.precipitationMm;
    if (precipitationMm === null) {
      missingOutcome += 1;
      continue;
    }
    const nws = boundedProbability(snapshot.nwsProbabilityPercent);
    const hrrr = hrrrProbability(snapshot.hrrrPrecipitationMm);
    rows.push({
      predictionId: snapshot.id,
      issuedAt: snapshot.issuedAt,
      dataAsOf: snapshot.availableAt,
      location: snapshot.location,
      targetStart: snapshot.targetStart,
      targetEnd: snapshot.targetEnd,
      target: { rainObserved: precipitationMm >= measurableRainThresholdMm, precipitationMm, observedAt: outcome.observedAt, sourceId: outcome.sourceId },
      features: { nwsProbabilityPercent: nws, hrrrPrecipitationMm: snapshot.hrrrPrecipitationMm, ...snapshot.features },
      baselines: { nws, hrrr, equalWeightEnsemble: nws === null || hrrr === null ? null : boundedProbability((nws + hrrr) / 2) },
      provenance: { forecastSourceIds: [...snapshot.sourceIds].sort(), outcomeSourceId: outcome.sourceId },
    });
  }

  return {
    metadata: {
      schemaVersion: datasetSchemaVersion,
      generatedAt,
      bounds: centralFloridaBounds,
      measurableRainThresholdMm,
      rowCount: rows.length,
      inputSnapshotCount: input.snapshots.length,
      inputObservationCount: input.observations.length,
      excluded: { futureForecast, outOfBounds, missingOutcome },
    },
    rows,
  };
}
