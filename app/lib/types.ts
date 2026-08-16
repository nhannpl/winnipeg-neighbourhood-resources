export const TOPICS = [
  "Mental Health / Addictions",
  "Older Adults",
  "Homelessness",
  "Food / Basic Needs",
  "Emergency / Crisis",
  "Housing",
  "2SLGBTQ+",
  "Accessibility",
  "Community and Culture",
  "Consumer Debt Services",
  "Education",
  "Employment / Training",
  "Health",
  "Income Support",
  "Indigenous",
  "Legal Advocacy",
  "Newcomers",
  "Parenting",
  "Victim Support",
  "Youth / Young Adults",
] as const;

export type Topic = (typeof TOPICS)[number];
export type ServiceMethod = "In person" | "Phone" | "Online" | "Mobile";

export interface Organization {
  id: string;
  name: string;
  providerType: "Government" | "Health authority" | "Nonprofit";
  website: string;
  sourceUrls: string[];
}

export interface Program {
  id: string;
  organizationId: string;
  organization: string;
  name: string;
  description: string;
  topics: Topic[];
  methods: ServiceMethod[];
  serviceArea: string;
  eligibility: string;
  ageRange: string;
  languages: string[];
  cost: string;
  intake: string;
  phone: string;
  website: string;
  status: "Active" | "Reverification needed";
  verifiedAt: string;
  sourceUrls: string[];
  emergency: boolean;
}

export interface ServiceLocation {
  id: string;
  programId: string;
  visibility: "Public" | "Confidential" | "Service area";
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  accessibility: string;
  hours: string;
}

export interface DirectoryData {
  organizations: Organization[];
  programs: Program[];
  locations: ServiceLocation[];
}

export interface FilterOptions {
  query: string;
  topics: Topic[];
  method?: ServiceMethod | "All";
  freeOnly?: boolean;
  language?: string;
  accessibleOnly?: boolean;
}

export interface FilteredProgram extends Program {
  matchedTopics: Topic[];
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface PropertyContext {
  normalizedAddress: string;
  coordinates: Coordinate;
  neighbourhood: string;
  crime: {
    period: string;
    incidents: number;
    ratePer1000: number;
    trendPercent: number;
  };
  nearbyProgramIds: string[];
}
