import { afterEach, describe, expect, it, vi } from "vitest";

import { clearRadarCache, getRadarSnapshot, parseRadarFrames } from "../../lib/radar";

const payload = {
  host: "https://tilecache.rainviewer.com",
  radar: { past: [
    { time: 1787153400, path: "/v2/radar/1787153400" },
    { time: 1787152800, path: "/v2/radar/1787152800" },
  ] },
};

afterEach(() => clearRadarCache());

describe("live radar provider", () => {
  it("normalizes and chronologically orders recent observed frames", () => {
    expect(parseRadarFrames(payload)).toEqual([
      expect.objectContaining({ observedAt: "2026-08-19T15:20:00.000Z", tileUrl: "https://tilecache.rainviewer.com/v2/radar/1787152800/256/{z}/{x}/{y}/2/1_1.png" }),
      expect.objectContaining({ observedAt: "2026-08-19T15:30:00.000Z" }),
    ]);
  });

  it("rejects incomplete metadata and caches a usable snapshot", async () => {
    expect(parseRadarFrames({ radar: { past: [{ time: 3, path: "invalid" }] } })).toEqual([]);
    const fetcher = vi.fn(async () => new Response(JSON.stringify(payload))) as unknown as typeof fetch;
    const first = await getRadarSnapshot(fetcher);
    const second = await getRadarSnapshot(fetcher);
    expect(first.cache.status).toBe("miss");
    expect(second.cache.status).toBe("hit");
    expect(second.latestObservedAt).toBe("2026-08-19T15:30:00.000Z");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("gives a human-readable failure when the radar source cannot be reached", async () => {
    await expect(getRadarSnapshot(vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch)).rejects.toThrow("Live radar is temporarily unavailable");
  });
});
