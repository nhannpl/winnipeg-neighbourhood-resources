import { TOPICS } from "./types.ts";
import type {
  Coordinate,
  DirectoryData,
  FilteredProgram,
  FilterOptions,
  Program,
} from "./types.ts";

const DAY = 24 * 60 * 60 * 1000;

export function validateDirectory(data: DirectoryData): string[] {
  const errors: string[] = [];
  const organizationIds = new Set(data.organizations.map((item) => item.id));
  const programIds = new Set<string>();

  for (const program of data.programs) {
    if (programIds.has(program.id)) errors.push(`duplicate program: ${program.id}`);
    programIds.add(program.id);
    if (!organizationIds.has(program.organizationId)) errors.push(`missing organization: ${program.id}`);
    if (!program.serviceArea) errors.push(`missing service area: ${program.id}`);
    if (!program.status) errors.push(`missing status: ${program.id}`);
    if (!program.verifiedAt) errors.push(`missing verification date: ${program.id}`);
    if (!program.phone && !program.website) errors.push(`missing contact: ${program.id}`);
    if (!program.sourceUrls.length) errors.push(`missing source: ${program.id}`);
    for (const topic of program.topics) {
      if (!TOPICS.includes(topic)) errors.push(`invalid topic on ${program.id}: ${topic}`);
    }
  }

  for (const location of data.locations) {
    if (!programIds.has(location.programId)) errors.push(`missing program: ${location.id}`);
    if (
      location.visibility === "Confidential" &&
      (location.address || location.latitude !== undefined || location.longitude !== undefined)
    ) {
      errors.push(`confidential location exposes address or coordinates: ${location.id}`);
    }
    if (
      location.visibility === "Public" &&
      (!location.address || location.latitude === undefined || location.longitude === undefined)
    ) {
      errors.push(`public location is incomplete: ${location.id}`);
    }
  }

  return errors;
}

export function filterPrograms(
  programs: Program[],
  options: FilterOptions,
): FilteredProgram[] {
  const query = options.query.trim().toLocaleLowerCase();

  return programs
    .map((program) => ({
      ...program,
      matchedTopics: options.topics.length
        ? program.topics.filter((topic) => options.topics.includes(topic))
        : program.topics,
    }))
    .filter((program) => !options.topics.length || program.matchedTopics.length > 0)
    .filter((program) => {
      if (!query) return true;
      return [
        program.name,
        program.organization,
        program.description,
        program.serviceArea,
        program.eligibility,
        ...program.topics,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    })
    .filter((program) => !options.method || options.method === "All" || program.methods.includes(options.method))
    .filter((program) => !options.freeOnly || program.cost.toLocaleLowerCase().includes("free"))
    .filter((program) => !options.language || program.languages.includes(options.language))
    .sort((a, b) => Number(b.emergency) - Number(a.emergency) || a.name.localeCompare(b.name));
}

export function summarizeFreshness(programs: Program[], now = new Date()) {
  const staleProgramIds = programs
    .filter((program) => {
      const ageDays = Math.floor((now.getTime() - new Date(`${program.verifiedAt}T00:00:00Z`).getTime()) / DAY);
      return ageDays > (program.emergency ? 30 : 90);
    })
    .map((program) => program.id);

  return {
    total: programs.length,
    dueForReverification: staleProgramIds.length,
    staleProgramIds,
  };
}

export function distanceKm(from: Coordinate, to: Coordinate): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
