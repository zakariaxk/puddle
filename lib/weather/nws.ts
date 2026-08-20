import { isCentralFloridaCoordinate } from "../location";
import type { ModelPrecipitationPeriod, SourceHealth, SurfaceObservation, WeatherSnapshot } from "./types";

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 7000;
const NWS_HEADERS = {
  Accept: "application/geo+json, application/json",
  "User-Agent": "Puddle weather provider (contact: development@puddle.local)",
};

type CacheEntry = { expiresAt: number; snapshot: Omit<WeatherSnapshot, "cache"> };
const cache = new Map<string, CacheEntry>();

type NwsPoint = { properties?: { observationStations?: string; forecastGridData?: string } };
type NwsStationList = { features?: Array<{ id?: string; properties?: { stationIdentifier?: string } }> };
type NwsObservation = { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> };
type NwsGridValue = { validTime?: string; value?: number | null };
type NwsGrid = { properties?: { updateTime?: string; quantitativePrecipitation?: { values?: NwsGridValue[] }; probabilityOfPrecipitation?: { values?: NwsGridValue[] } } };

function cacheKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function measure(properties: Record<string, unknown>, key: string): number | null {
  const value = properties[key];
  return value && typeof value === "object" && "value" in value ? asNumber(value.value) : null;
}

function parseValidTime(validTime: string): { validFrom: string; validTo: string } | null {
  const [start, duration] = validTime.split("/");
  if (!start || !duration || Number.isNaN(Date.parse(start))) return null;
  const hours = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(duration);
  if (!hours) return null;
  const milliseconds = (Number(hours[1] ?? 0) * 60 + Number(hours[2] ?? 0)) * 60 * 1000;
  if (!milliseconds) return null;
  return { validFrom: new Date(start).toISOString(), validTo: new Date(Date.parse(start) + milliseconds).toISOString() };
}

function normalizePrecipitation(grid: NwsGrid): ModelPrecipitationPeriod[] {
  const probabilities = new Map(
    (grid.properties?.probabilityOfPrecipitation?.values ?? []).flatMap(({ validTime, value }) => {
      if (!validTime) return [];
      const period = parseValidTime(validTime);
      return period ? [[`${period.validFrom}/${period.validTo}`, asNumber(value)] as const] : [];
    }),
  );
  return (grid.properties?.quantitativePrecipitation?.values ?? []).flatMap(({ validTime, value }) => {
    if (!validTime) return [];
    const period = parseValidTime(validTime);
    return period ? [{ ...period, quantitativePrecipitationMm: asNumber(value), probabilityPercent: probabilities.get(`${period.validFrom}/${period.validTo}`) ?? null }] : [];
  }).slice(0, 12);
}

function normalizeObservation(stationId: string, observation: NwsObservation): SurfaceObservation | null {
  const properties = observation.properties;
  const coordinates = observation.geometry?.coordinates;
  if (!properties || !Array.isArray(coordinates) || coordinates.length < 2 || typeof properties.timestamp !== "string") return null;
  const [longitude, latitude] = coordinates;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return {
    stationId,
    observedAt: new Date(properties.timestamp).toISOString(),
    latitude,
    longitude,
    temperatureC: measure(properties, "temperature"),
    dewpointC: measure(properties, "dewpoint"),
    relativeHumidityPercent: measure(properties, "relativeHumidity"),
    windSpeedKph: measure(properties, "windSpeed"),
    precipitationLastHourMm: measure(properties, "precipitationLastHour"),
  };
}

async function getJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(url, { headers: NWS_HEADERS, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new Error("The National Weather Service could not be reached.");
  }
  if (!response.ok) throw new Error(`The National Weather Service returned ${response.status}.`);
  return response.json() as Promise<T>;
}

function unavailable(id: SourceHealth["id"], dataset: string, fetchedAt: string, error: unknown): SourceHealth {
  return { id, provider: "National Weather Service", dataset, kind: id === "nws-ndfd" ? "model" : "observation", status: "unavailable", fetchedAt, message: error instanceof Error ? error.message : "This source is temporarily unavailable." };
}

export async function getNwsWeatherSnapshot(latitude: number, longitude: number, fetcher: typeof fetch = fetch): Promise<WeatherSnapshot> {
  if (!isCentralFloridaCoordinate(latitude, longitude)) throw new RangeError("Choose a location in Central Florida.");

  const key = cacheKey(latitude, longitude);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return { ...cached.snapshot, cache: { status: "hit", expiresAt: new Date(cached.expiresAt).toISOString() } };
  }

  const fetchedAt = new Date(now).toISOString();
  const points = await getJson<NwsPoint>(`https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`, fetcher);
  const stationsUrl = points.properties?.observationStations;
  const gridUrl = points.properties?.forecastGridData;
  const health: SourceHealth[] = [];
  let observation: SurfaceObservation | null = null;
  let model: WeatherSnapshot["model"] = null;

  const [observationsResult, gridResult] = await Promise.allSettled([
    stationsUrl ? getJson<NwsStationList>(stationsUrl, fetcher) : Promise.reject(new Error("No observation station list was supplied.")),
    gridUrl ? getJson<NwsGrid>(gridUrl, fetcher) : Promise.reject(new Error("No forecast grid was supplied.")),
  ]);

  if (observationsResult.status === "fulfilled") {
    const station = observationsResult.value.features?.[0];
    const stationId = station?.properties?.stationIdentifier ?? station?.id?.split("/").pop();
    if (station?.id && stationId) {
      const result = await Promise.allSettled([getJson<NwsObservation>(`${station.id}/observations/latest`, fetcher)]);
      if (result[0].status === "fulfilled") {
        observation = normalizeObservation(stationId, result[0].value);
        if (observation) health.push({ id: "nws-observations", provider: "National Weather Service", dataset: "NWS station observation", kind: "observation", status: "available", fetchedAt, sourceTimestamp: observation.observedAt });
        else health.push(unavailable("nws-observations", "NWS station observation", fetchedAt, new Error("The latest station observation was malformed.")));
      } else health.push(unavailable("nws-observations", "NWS station observation", fetchedAt, result[0].reason));
    } else health.push(unavailable("nws-observations", "NWS station observation", fetchedAt, new Error("No nearby station was supplied.")));
  } else health.push(unavailable("nws-observations", "NWS station observation", fetchedAt, observationsResult.reason));

  if (gridResult.status === "fulfilled") {
    const precipitation = normalizePrecipitation(gridResult.value);
    const updatedAt = gridResult.value.properties?.updateTime && !Number.isNaN(Date.parse(gridResult.value.properties.updateTime))
      ? new Date(gridResult.value.properties.updateTime).toISOString()
      : null;
    if (precipitation.length) {
      model = { model: "NWS National Digital Forecast Database", updatedAt, precipitation };
      health.push({ id: "nws-ndfd", provider: "National Weather Service", dataset: "National Digital Forecast Database", kind: "model", status: "available", fetchedAt, sourceTimestamp: updatedAt ?? precipitation[0].validFrom });
    } else health.push(unavailable("nws-ndfd", "National Digital Forecast Database", fetchedAt, new Error("The forecast grid did not include usable precipitation guidance.")));
  } else health.push(unavailable("nws-ndfd", "National Digital Forecast Database", fetchedAt, gridResult.reason));

  const available = health.filter((source) => source.status === "available").length;
  const snapshot: Omit<WeatherSnapshot, "cache"> = {
    location: { latitude, longitude }, fetchedAt, health, observation, model,
    status: available === health.length ? "complete" : available ? "degraded" : "unavailable",
    message: available === health.length ? "Live sources are available." : available ? "Some live sources are temporarily unavailable; returned data is reduced." : "Live weather sources are temporarily unavailable. Try again shortly.",
  };
  const expiresAt = now + CACHE_TTL_MS;
  cache.set(key, { expiresAt, snapshot });
  return { ...snapshot, cache: { status: "miss", expiresAt: new Date(expiresAt).toISOString() } };
}

export function clearWeatherCache() {
  cache.clear();
}
