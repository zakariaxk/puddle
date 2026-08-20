import { inflateSync } from "node:zlib";

import { createRadarNowcast, type RadarGridFrame, type RadarNowcast } from "./nowcast";

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
const nowcastCache = new Map<string, { expiresAt: number; nowcast: RadarNowcast }>();
const NOWCAST_ZOOM = 7;
const NOWCAST_TILE_RANGE = { minX: 34, maxX: 35, minY: 52, maxY: 53 };
const NOWCAST_CELL_SIZE = 16;

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

function pngRgba(bytes: Uint8Array) {
  const signature = "89504e470d0a1a0a";
  if (Buffer.from(bytes.subarray(0, 8)).toString("hex") !== signature) throw new Error("Unsupported radar tile.");
  let offset = 8;
  let width = 0;
  let height = 0;
  const data: Buffer[] = [];
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
    const type = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString("ascii");
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = new DataView(chunk.buffer, chunk.byteOffset, 4).getUint32(0);
      height = new DataView(chunk.buffer, chunk.byteOffset + 4, 4).getUint32(0);
      if (chunk[8] !== 8 || chunk[9] !== 6 || chunk[12] !== 0) throw new Error("Unsupported radar tile.");
    }
    if (type === "IDAT") data.push(Buffer.from(chunk));
    if (type === "IEND") break;
    offset += length + 12;
  }
  if (!width || !height || !data.length) throw new Error("Invalid radar tile.");
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[source++];
    for (let x = 0; x < stride; x += 1) {
      const current = raw[source++];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const above = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const paeth = () => {
        const p = left + above - upperLeft;
        const distances = [Math.abs(p - left), Math.abs(p - above), Math.abs(p - upperLeft)];
        return distances[0] <= distances[1] && distances[0] <= distances[2] ? left : distances[1] <= distances[2] ? above : upperLeft;
      };
      pixels[y * stride + x] = (current + (filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth() : 0)) & 255;
    }
  }
  return { width, height, pixels };
}

function tileUrl(frame: RadarFrame, x: number, y: number) {
  return frame.tileUrl.replace("{z}", String(NOWCAST_ZOOM)).replace("{x}", String(x)).replace("{y}", String(y));
}

async function sampleRadarFrame(frame: RadarFrame, fetcher: typeof fetch): Promise<RadarGridFrame> {
  const tiles = await Promise.all(Array.from({ length: 4 }, async (_, index) => {
    const x = NOWCAST_TILE_RANGE.minX + (index % 2);
    const y = NOWCAST_TILE_RANGE.minY + Math.floor(index / 2);
    const response = await fetcher(tileUrl(frame, x, y), { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error("Radar tile unavailable.");
    return pngRgba(new Uint8Array(await response.arrayBuffer()));
  }));
  const cellsPerTile = 256 / NOWCAST_CELL_SIZE;
  const values = Array.from({ length: cellsPerTile * 2 * cellsPerTile * 2 }, () => 0);
  tiles.forEach((tile, tileIndex) => {
    if (tile.width !== 256 || tile.height !== 256) throw new Error("Unexpected radar tile size.");
    for (let y = 0; y < cellsPerTile; y += 1) for (let x = 0; x < cellsPerTile; x += 1) {
      let alpha = 0;
      for (let pixelY = y * NOWCAST_CELL_SIZE; pixelY < (y + 1) * NOWCAST_CELL_SIZE; pixelY += 1) for (let pixelX = x * NOWCAST_CELL_SIZE; pixelX < (x + 1) * NOWCAST_CELL_SIZE; pixelX += 1) alpha += tile.pixels[(pixelY * 256 + pixelX) * 4 + 3];
      const gridX = (tileIndex % 2) * cellsPerTile + x;
      const gridY = Math.floor(tileIndex / 2) * cellsPerTile + y;
      values[gridY * cellsPerTile * 2 + gridX] = alpha / (NOWCAST_CELL_SIZE * NOWCAST_CELL_SIZE * 255);
    }
  });
  return { observedAt: frame.observedAt, width: cellsPerTile * 2, height: cellsPerTile * 2, values };
}

export async function getRadarNowcast(fetcher: typeof fetch = fetch): Promise<RadarNowcast> {
  const cached = nowcastCache.get("central-florida");
  if (cached && cached.expiresAt > Date.now()) return cached.nowcast;
  try {
    const snapshot = await getRadarSnapshot(fetcher);
    const frames = snapshot.frames.slice(-2);
    if (frames.length < 2) return createRadarNowcast([]);
    const nowcast = createRadarNowcast(await Promise.all(frames.map((frame) => sampleRadarFrame(frame, fetcher))));
    nowcastCache.set("central-florida", { expiresAt: Date.now() + CACHE_TTL_MS, nowcast });
    return nowcast;
  } catch {
    return createRadarNowcast([]);
  }
}

export function clearRadarCache() {
  cache.clear();
  nowcastCache.clear();
}
