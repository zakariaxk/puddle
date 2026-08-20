export type RadarGridFrame = {
  observedAt: string;
  width: number;
  height: number;
  values: number[];
};

export type RadarNowcast = {
  status: "available" | "unavailable";
  generatedAt: string;
  observedAt: string | null;
  motion: { eastPixelsPerMinute: number; southPixelsPerMinute: number } | null;
  rainCenter: { x: number; y: number; strength: number } | null;
  projections: Array<{ minutes: 15 | 30 | 60; x: number; y: number; uncertaintyPixels: number }>;
  message: string;
};

const projectionMinutes = [15, 30, 60] as const;

function meaningful(frame: RadarGridFrame) {
  return frame.values.some((value) => value > 0.08);
}

function weightedCenter(frame: RadarGridFrame) {
  let total = 0;
  let x = 0;
  let y = 0;
  frame.values.forEach((value, index) => {
    const weight = Math.max(0, value - 0.08);
    total += weight;
    x += (index % frame.width + 0.5) * weight;
    y += (Math.floor(index / frame.width) + 0.5) * weight;
  });
  return total ? { x: x / total, y: y / total, strength: total / frame.values.length } : null;
}

function compatible(first: RadarGridFrame, second: RadarGridFrame) {
  return first.width === second.width && first.height === second.height && first.values.length === second.values.length;
}

export function createRadarNowcast(frames: RadarGridFrame[], now = Date.now()): RadarNowcast {
  const ordered = [...frames].sort((first, second) => Date.parse(first.observedAt) - Date.parse(second.observedAt));
  const latest = ordered.at(-1);
  const previous = ordered.at(-2);
  const unavailable = (message: string): RadarNowcast => ({
    status: "unavailable", generatedAt: new Date(now).toISOString(), observedAt: latest?.observedAt ?? null,
    motion: null, rainCenter: null, projections: [], message,
  });

  if (!latest || !previous || !compatible(previous, latest)) return unavailable("Puddle needs two aligned radar frames before it can estimate rain movement.");
  const minutes = (Date.parse(latest.observedAt) - Date.parse(previous.observedAt)) / 60_000;
  if (!Number.isFinite(minutes) || minutes < 4 || minutes > 16) return unavailable("Recent radar frames are too far apart to estimate rain movement safely.");
  if (!meaningful(previous) || !meaningful(latest)) return unavailable("No measurable rain area is visible in the recent radar frames to project.");

  const from = weightedCenter(previous);
  const to = weightedCenter(latest);
  if (!from || !to) return unavailable("Puddle could not identify a consistent rain area to project.");
  const displacement = Math.hypot(to.x - from.x, to.y - from.y);
  if (displacement > Math.max(latest.width, latest.height) * 0.65) return unavailable("Radar movement changed too sharply to project safely.");
  const motion = { eastPixelsPerMinute: (to.x - from.x) / minutes, southPixelsPerMinute: (to.y - from.y) / minutes };
  const growth = Math.abs(to.strength - from.strength) / Math.max(from.strength, 0.01);

  return {
    status: "available", generatedAt: new Date(now).toISOString(), observedAt: latest.observedAt,
    motion, rainCenter: to,
    projections: projectionMinutes.map((minutesAhead) => ({
      minutes: minutesAhead,
      x: to.x + motion.eastPixelsPerMinute * minutesAhead,
      y: to.y + motion.southPixelsPerMinute * minutesAhead,
      uncertaintyPixels: Math.round(8 + minutesAhead * (0.45 + Math.min(growth, 1.5) * 0.35)),
    })),
    message: "Projected rain position is an estimate from recent radar movement; its uncertainty expands over time.",
  };
}
