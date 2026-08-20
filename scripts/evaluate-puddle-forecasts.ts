import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { evaluatePuddleForecasts } from "../lib/evaluation.ts";
import type { HistoricalDataset } from "../lib/historical-dataset.ts";
import { validatePuddleModelArtifact } from "../lib/ml.ts";

const [datasetPath, modelPath, outputPath, generatedAt] = process.argv.slice(2);
if (!datasetPath || !modelPath || !outputPath || !generatedAt) throw new Error("Usage: npm run forecast:evaluate -- <dataset.json> <model.json> <report.json> <generated-at-iso>");

const dataset = JSON.parse(await readFile(datasetPath, "utf8")) as HistoricalDataset;
const artifact: unknown = JSON.parse(await readFile(modelPath, "utf8"));
if (!validatePuddleModelArtifact(artifact)) throw new Error("The model artifact is not a selected Phase 9 Puddle model.");
const report = evaluatePuddleForecasts(dataset, artifact, generatedAt);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${report.dataWindow.independentRowCount} independent rows to ${outputPath}.`);
