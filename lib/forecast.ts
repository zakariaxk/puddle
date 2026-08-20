import type { ModelPrecipitationPeriod, WeatherSnapshot } from "./weather/types";

export const forecastHorizons = [15, 30, 60, 120, 360] as const;
export type ForecastHorizonMinutes = typeof forecastHorizons[number];

export type ConsumerForecast = {
  location: WeatherSnapshot["location"];
  generatedAt: string;
  status: "available" | "degraded" | "unavailable";
  message: string;
  horizons: Array<{
    minutes: ForecastHorizonMinutes;
    probabilityPercent: number;
    intensity: "none" | "light" | "moderate" | "heavy";
    arrival: string | null;
  }>;
  confidence: "high" | "moderate" | "low";
  why: string[];
  sources: WeatherSnapshot["health"];
  fetchedAt: string;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function overlapMilliseconds(period: ModelPrecipitationPeriod, start: number, end: number) {
  return Math.max(0, Math.min(Date.parse(period.validTo), end) - Math.max(Date.parse(period.validFrom), start));
}

function formatTimeRange(start: number, end: number) {
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

function probabilityFromQpf(mm: number) {
  if (mm < 0.1) return 8;
  return clamp(18 + mm * 36);
}

function intensityFor(mm: number): "none" | "light" | "moderate" | "heavy" {
  if (mm < 0.1) return "none";
  if (mm < 2.5) return "light";
  if (mm < 7.5) return "moderate";
  return "heavy";
}

function deriveHorizon(periods: ModelPrecipitationPeriod[], minutes: ForecastHorizonMinutes, now: number, observationRainMm: number | null) {
  const end = now + minutes * 60_000;
  let coveredMs = 0;
  let weightedProbability = 0;
  let totalMm = 0;
  let arrival: string | null = null;

  for (const period of periods) {
    const overlap = overlapMilliseconds(period, now, end);
    if (!overlap) continue;
    const duration = Date.parse(period.validTo) - Date.parse(period.validFrom);
    const fraction = duration > 0 ? overlap / duration : 0;
    const mm = (period.quantitativePrecipitationMm ?? 0) * fraction;
    const probability = period.probabilityPercent ?? probabilityFromQpf(period.quantitativePrecipitationMm ?? 0);
    coveredMs += overlap;
    weightedProbability += probability * overlap;
    totalMm += mm;
    if (!arrival && probability >= 30 && (period.quantitativePrecipitationMm ?? 0) >= 0.1) {
      arrival = formatTimeRange(Math.max(now, Date.parse(period.validFrom)), Math.min(end, Date.parse(period.validTo)));
    }
  }

  const coverage = coveredMs / (minutes * 60_000);
  const modelProbability = coveredMs ? weightedProbability / coveredMs : 0;
  const observationAdjustment = observationRainMm !== null && observationRainMm >= 0.1 ? 12 : 0;
  return {
    minutes,
    probabilityPercent: clamp(modelProbability * coverage + observationAdjustment),
    intensity: intensityFor(totalMm),
    arrival,
  };
}

export function createConsumerForecast(snapshot: WeatherSnapshot, now = Date.now()): ConsumerForecast {
  const model = snapshot.model;
  if (!model?.precipitation.length) {
    return {
      location: snapshot.location, generatedAt: new Date(now).toISOString(), status: "unavailable",
      message: "Puddle cannot make a next-hour estimate until the NWS forecast guidance returns.",
      horizons: [], confidence: "low", why: ["NWS forecast guidance is temporarily unavailable, so Puddle will not estimate a chance of rain."],
      sources: snapshot.health, fetchedAt: snapshot.fetchedAt,
    };
  }

  const observation = snapshot.observation;
  const observationAgeMinutes = observation ? (now - Date.parse(observation.observedAt)) / 60_000 : Infinity;
  const hasFreshObservation = observationAgeMinutes <= 90;
  const confidence = snapshot.status === "complete" && hasFreshObservation ? "high" : hasFreshObservation ? "moderate" : "low";
  const status = snapshot.status === "complete" ? "available" : "degraded";
  const horizons = forecastHorizons.map((minutes) => deriveHorizon(model.precipitation, minutes, now, observation?.precipitationLastHourMm ?? null));
  const oneHour = horizons.find((horizon) => horizon.minutes === 60)!;
  const why = [
    `NWS forecast guidance indicates a ${oneHour.probabilityPercent}% chance of measurable rain in the next hour at this map point.`,
    oneHour.arrival ? `The earliest model window with meaningful precipitation is ${oneHour.arrival}.` : "The current NWS guidance does not indicate a meaningful precipitation window in the next hour.",
    observation && hasFreshObservation
      ? `A nearby NWS station observed ${observation.precipitationLastHourMm ?? 0} mm of rain in its last hour; this is context, not a measurement at your selected point.`
      : "No fresh nearby station observation is available, so confidence is reduced.",
    "This is a transparent reading of NWS guidance, not a trained Puddle model or radar nowcast.",
  ];
  return {
    location: snapshot.location, generatedAt: new Date(now).toISOString(), status,
    message: status === "available" ? "NWS guidance and nearby observations are available." : "Some live inputs are unavailable or stale, so confidence is reduced.",
    horizons, confidence, why, sources: snapshot.health, fetchedAt: snapshot.fetchedAt,
  };
}
