import { mkdir, writeFile } from "node:fs/promises";

import { summarizeFreshness, validateDirectory } from "../app/lib/directory.ts";
import { directoryData } from "../app/lib/services.ts";
import { TOPICS } from "../app/lib/types.ts";

const freshness = summarizeFreshness(directoryData.programs, new Date("2026-08-16T12:00:00Z"));
const validationErrors = validateDirectory(directoryData);
const topicCoverage = Object.fromEntries(
  TOPICS.map((topic) => [
    topic,
    directoryData.programs.filter((program) => program.topics.includes(topic)).length,
  ]),
);

const report = {
  generatedAt: "2026-08-16T12:00:00-05:00",
  statement: "Reviewed directory of verified services; it is not exhaustive and services can change. Call before visiting.",
  organizations: directoryData.organizations.length,
  programs: directoryData.programs.length,
  publicLocations: directoryData.locations.filter((item) => item.visibility === "Public").length,
  confidentialLocations: directoryData.locations.filter((item) => item.visibility === "Confidential").length,
  serviceAreaEntries: directoryData.locations.filter((item) => item.visibility === "Service area").length,
  dueForReverification: freshness.dueForReverification,
  topicCoverage,
  validationErrors,
  sources: [...new Set(directoryData.programs.flatMap((program) => program.sourceUrls))].sort(),
};

await mkdir(new URL("../public/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/freshness-report.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
