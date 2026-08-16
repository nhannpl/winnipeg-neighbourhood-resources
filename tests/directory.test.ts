import assert from "node:assert/strict";
import test from "node:test";

import {
  distanceKm,
  filterPrograms,
  summarizeFreshness,
  validateDirectory,
} from "../app/lib/directory.ts";
import type { DirectoryData, Program } from "../app/lib/types.ts";
import { TOPICS } from "../app/lib/types.ts";
import { directoryData } from "../app/lib/services.ts";

const baseProgram: Program = {
  id: "program-1",
  organizationId: "org-1",
  name: "Community support",
  description: "Verified support for Winnipeg residents.",
  topics: ["Housing", "Homelessness"],
  methods: ["In person"],
  serviceArea: "Winnipeg",
  eligibility: "Adults",
  ageRange: "18+",
  languages: ["English"],
  cost: "Free",
  intake: "Call or walk in",
  phone: "204-555-0100",
  website: "https://example.org/program",
  status: "Active",
  verifiedAt: "2026-08-01",
  sourceUrls: ["https://example.org/program"],
  emergency: false,
  organization: "Community Org",
};

const baseData: DirectoryData = {
  organizations: [
    {
      id: "org-1",
      name: "Community Org",
      providerType: "Nonprofit",
      website: "https://example.org",
      sourceUrls: ["https://example.org"],
    },
  ],
  programs: [baseProgram],
  locations: [
    {
      id: "location-1",
      programId: "program-1",
      visibility: "Public",
      name: "Community Org",
      address: "100 Main Street, Winnipeg",
      latitude: 49.895,
      longitude: -97.138,
      accessibility: "Call for details",
      hours: "Weekdays",
    },
  ],
};

test("rejects confidential locations that expose an address or coordinates", () => {
  const data = structuredClone(baseData);
  data.locations[0] = {
    ...data.locations[0],
    visibility: "Confidential",
  };

  const errors = validateDirectory(data);

  assert.ok(errors.some((error) => error.includes("confidential")));
});

test("returns a multi-topic program once and explains matching topics", () => {
  const result = filterPrograms(baseData.programs, {
    query: "support",
    topics: ["Housing", "Homelessness"],
  });

  assert.equal(result.length, 1);
  assert.deepEqual(result[0].matchedTopics, ["Housing", "Homelessness"]);
});

test("orders emergency programs before ordinary results", () => {
  const crisis = {
    ...baseProgram,
    id: "crisis",
    name: "Crisis line",
    topics: ["Emergency / Crisis"] as Program["topics"],
    emergency: true,
  };

  const result = filterPrograms([baseProgram, crisis], {
    query: "",
    topics: ["Emergency / Crisis"],
  });

  assert.equal(result[0].id, "crisis");
});

test("uses a 30-day freshness window for emergency programs and 90 days otherwise", () => {
  const emergency = {
    ...baseProgram,
    id: "emergency",
    emergency: true,
    verifiedAt: "2026-07-01",
  };
  const summary = summarizeFreshness(
    [baseProgram, emergency],
    new Date("2026-08-16T12:00:00Z"),
  );

  assert.equal(summary.total, 2);
  assert.equal(summary.dueForReverification, 1);
  assert.deepEqual(summary.staleProgramIds, ["emergency"]);
});

test("calculates distance between Winnipeg locations", () => {
  const distance = distanceKm(
    { latitude: 49.8951, longitude: -97.1384 },
    { latitude: 49.8844, longitude: -97.1472 },
  );

  assert.ok(distance > 1 && distance < 2);
});

test("accepts a complete public directory record", () => {
  assert.deepEqual(validateDirectory(baseData), []);
});

test("published directory covers every approved topic with valid records", () => {
  assert.deepEqual(validateDirectory(directoryData), []);
  const coveredTopics = new Set(directoryData.programs.flatMap((program) => program.topics));
  assert.deepEqual([...coveredTopics].sort(), [...TOPICS].sort());
});

test("published directory does not leak confidential location details", () => {
  const confidential = directoryData.locations.filter(
    (location) => location.visibility === "Confidential",
  );
  assert.ok(confidential.length > 0);
  for (const location of confidential) {
    assert.equal(location.address, undefined);
    assert.equal(location.latitude, undefined);
    assert.equal(location.longitude, undefined);
  }
});
