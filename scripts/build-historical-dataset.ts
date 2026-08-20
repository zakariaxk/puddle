import { readFile, writeFile } from "node:fs/promises";

import { buildHistoricalDataset, type HistoricalDatasetInput } from "../lib/historical-dataset.ts";

const [inputPath, outputPath, generatedAt] = process.argv.slice(2);

if (!inputPath || !outputPath || !generatedAt) {
  throw new Error("Usage: node --experimental-strip-types scripts/build-historical-dataset.ts <input.json> <output.json> <generated-at-iso>");
}

const input = JSON.parse(await readFile(inputPath, "utf8")) as HistoricalDatasetInput;
const dataset = buildHistoricalDataset(input, generatedAt);
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`Wrote ${dataset.metadata.rowCount} rows to ${outputPath}.`);
