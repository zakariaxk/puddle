export type RadarFrame = {
  observedAt: string;
  tileUrl: string;
};

export type RadarSnapshot = {
  provider: "RainViewer";
  dataset: "Weather radar observations";
  fetchedAt: string;
  latestObservedAt: string;
  frames: RadarFrame[];
  cache: { status: "hit" | "miss"; expiresAt: string };
};

type RainViewerResponse = {
  host?: string;
  radar?: { past?: Array<{ time?: number; path?: string }> };
};

type CacheEntry = { expiresAt: number; snapshot: Omit<RadarSnapshot, "cache"> };

const CACHE_TTL_MS = 2 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 7000;
const MAX_FRAMES = 8;
const cache = new Map<string, CacheEntry>();

function normalizeHost(host: string) {
  return host.replace(/\/$/, "");
}

export function parseRadarFrames(payload: RainViewerResponse): RadarFrame[] {
  const host = typeof payload.host === "string" && payload.host.startsWith("https://") ? normalizeHost(payload.host) : null;
  if (!host) return [];

  return (payload.radar?.past ?? []).flatMap((frame) => {
    if (typeof frame.time !== "number" || !Number.isFinite(frame.time) || typeof frame.path !== "string" || !frame.path.startsWith("/")) return [];
    const observedAt = new Date(frame.time * 1000);
    if (Number.isNaN(observedAt.getTime())) return [];
    return [{ observedAt: observedAt.toISOString(), tileUrl: `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png` }];
  }).sort((first, second) => Date.parse(first.observedAt) - Date.parse(second.observedAt)).slice(-MAX_FRAMES);
}

export async function getRadarSnapshot(fetcher: typeof fetch = fetch): Promise<RadarSnapshot> {
  const cached = cache.get("central-florida");
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return { ...cached.snapshot, cache: { status: "hit", expiresAt: new Date(cached.expiresAt).toISOString() } };
  }

  let response: Response;
  try {
    response = await fetcher("https://api.rainviewer.com/public/weather-maps.json", { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new Error("Live radar is temporarily unavailable. Try again shortly.");
  }
  if (!response.ok) throw new Error("Live radar is temporarily unavailable. Try again shortly.");

  const frames = parseRadarFrames(await response.json() as RainViewerResponse);
  if (!frames.length) throw new Error("Live radar did not include usable recent observations. Try again shortly.");

  const snapshot: Omit<RadarSnapshot, "cache"> = {
    provider: "RainViewer",
    dataset: "Weather radar observations",
    fetchedAt: new Date(now).toISOString(),
    latestObservedAt: frames.at(-1)!.observedAt,
    frames,
  };
  const expiresAt = now + CACHE_TTL_MS;
  cache.set("central-florida", { expiresAt, snapshot });
  return { ...snapshot, cache: { status: "miss", expiresAt: new Date(expiresAt).toISOString() } };
}

export function clearRadarCache() {
  cache.clear();
}
