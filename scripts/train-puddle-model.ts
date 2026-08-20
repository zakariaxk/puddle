import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { HistoricalDataset } from "../lib/historical-dataset.ts";
import { trainPuddleModel } from "../lib/ml.ts";

const [inputPath, outputPath, trainedAt, version = "puddle-logistic-v1"] = process.argv.slice(2);
if (!inputPath || !outputPath || !trainedAt) throw new Error("Usage: npm run model:train -- <dataset.json> <model.json> <trained-at-iso> [version]");

const dataset = JSON.parse(await readFile(inputPath, "utf8")) as HistoricalDataset;
const result = trainPuddleModel(dataset, trainedAt, version);
if (!result.artifact) throw new Error(`${result.reason} Training rows: ${result.trainingRows}; validation rows: ${result.validationRows}. No production model artifact was written.`);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result.artifact, null, 2)}\n`);
console.log(`${result.reason} Wrote ${result.artifact.version} to ${outputPath}.`);
