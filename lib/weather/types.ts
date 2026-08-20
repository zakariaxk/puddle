export type SourceHealth = {
  id: "nws-observations" | "nws-ndfd";
  provider: "National Weather Service";
  dataset: string;
  kind: "observation" | "model";
  status: "available" | "unavailable";
  fetchedAt: string;
  sourceTimestamp?: string;
  message?: string;
};

export type SurfaceObservation = {
  stationId: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  temperatureC: number | null;
  dewpointC: number | null;
  relativeHumidityPercent: number | null;
  windSpeedKph: number | null;
  precipitationLastHourMm: number | null;
};

export type ModelPrecipitationPeriod = {
  validFrom: string;
  validTo: string;
  quantitativePrecipitationMm: number | null;
  probabilityPercent: number | null;
};

export type WeatherSnapshot = {
  location: { latitude: number; longitude: number };
  fetchedAt: string;
  cache: { status: "hit" | "miss"; expiresAt: string };
  health: SourceHealth[];
  observation: SurfaceObservation | null;
  model: {
    model: "NWS National Digital Forecast Database";
    updatedAt: string | null;
    precipitation: ModelPrecipitationPeriod[];
  } | null;
  status: "complete" | "degraded" | "unavailable";
  message: string;
};
