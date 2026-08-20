import { describe, expect, it } from "vitest";

import { createRadarNowcast, type RadarGridFrame } from "../../lib/nowcast";

function frame(observedAt: string, rainAt: number | null, width = 5): RadarGridFrame {
  const values = Array.from({ length: width * width }, (_, index) => index === rainAt ? 1 : 0);
  return { observedAt, width, height: width, values };
}

describe("radar nowcast", () => {
  it("projects a consistently moving rain area and widens uncertainty", () => {
    const nowcast = createRadarNowcast([frame("2026-08-20T12:00:00.000Z", 11), frame("2026-08-20T12:10:00.000Z", 12)]);
    expect(nowcast.status).toBe("available");
    expect(nowcast.motion?.eastPixelsPerMinute).toBeCloseTo(0.1);
    expect(nowcast.projections).toHaveLength(3);
    expect(nowcast.projections[2].uncertaintyPixels).toBeGreaterThan(nowcast.projections[0].uncertaintyPixels);
  });

  it("handles stationary rain and changing rain strength without inventing certainty", () => {
    const stationary = createRadarNowcast([frame("2026-08-20T12:00:00.000Z", 12), frame("2026-08-20T12:10:00.000Z", 12)]);
    expect(stationary.status).toBe("available");
    expect(stationary.motion?.eastPixelsPerMinute).toBe(0);
    expect(stationary.projections[2].uncertaintyPixels).toBeGreaterThan(stationary.projections[0].uncertaintyPixels);
  });

  it("falls back for gaps, missing rain, and misaligned frames", () => {
    expect(createRadarNowcast([frame("2026-08-20T12:00:00.000Z", 12), frame("2026-08-20T12:30:00.000Z", 13)]).status).toBe("unavailable");
    expect(createRadarNowcast([frame("2026-08-20T12:00:00.000Z", null), frame("2026-08-20T12:10:00.000Z", null)]).status).toBe("unavailable");
    expect(createRadarNowcast([frame("2026-08-20T12:00:00.000Z", 12), frame("2026-08-20T12:10:00.000Z", 12, 4)]).status).toBe("unavailable");
  });
});
