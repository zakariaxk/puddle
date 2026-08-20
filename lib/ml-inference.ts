import type { ConsumerForecast } from "./forecast";
import { calibratedProbability, extractLiveModelFeatures, type PuddleModelArtifact } from "./ml";
import type { WeatherSnapshot } from "./weather/types";

export function applyPuddleModel(forecast: ConsumerForecast, snapshot: WeatherSnapshot, artifact: PuddleModelArtifact, now = Date.now()): ConsumerForecast {
  if (forecast.status === "unavailable") return forecast;
  const features = extractLiveModelFeatures(snapshot, now);
  const probability = features ? calibratedProbability(features, artifact) : null;
  if (probability === null) return forecast;
  const probabilityPercent = Math.round(probability * 100);
  const horizons = forecast.horizons.map((horizon) => horizon.minutes === 60 ? { ...horizon, probabilityPercent } : horizon);
  return {
    ...forecast,
    horizons,
    modelVersion: artifact.version,
    why: [
      `Puddle's calibrated forecast estimates a ${probabilityPercent}% chance of measurable rain in the next hour at this map point.`,
      ...forecast.why.slice(1),
      `This estimate uses the evaluated ${artifact.version} calibration of current NWS guidance; it does not make an exact-rain guarantee.`,
    ],
  };
}
