import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { validatePuddleModelArtifact, type PuddleModelArtifact } from "./ml";

const modelPath = join(process.cwd(), "data", "models", "puddle-logistic-v1.json");
let cached: PuddleModelArtifact | null | undefined;

export async function loadProductionPuddleModel() {
  if (cached !== undefined) return cached;
  try {
    const parsed: unknown = JSON.parse(await readFile(modelPath, "utf8"));
    cached = validatePuddleModelArtifact(parsed) ? parsed : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function clearProductionPuddleModelCache() {
  cached = undefined;
}
