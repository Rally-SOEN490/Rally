// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { interestCatalog } from "@/lib/interests";
import { playerFilterCopy as copy } from "@/translations/player-filters.en";

export const PLAYER_LEVELS = ["C", "C+", "B-", "B"] as const;
export type SkillLevel = (typeof PLAYER_LEVELS)[number];
export type SavedInterests = {
  formats: string[];
  positions: string[];
  clubs?: string[];
  other?: string[];
};

export const PLAYER_POSITIONS = interestCatalog.positions;
export const PLAYER_INTEREST_OPTIONS = [
  { key: "beach", label: copy.interests.beach },
  { key: "indoors", label: copy.interests.indoors },
  { key: "9s", label: copy.interests.nines },
  { key: "6s", label: copy.interests.sixes },
  { key: "4s", label: copy.interests.fours },
  { key: "2s", label: copy.interests.twos },
  { key: "mixed", label: copy.interests.mixed },
] as const;
export type PositionKey = (typeof PLAYER_POSITIONS)[number]["key"];
export type InterestKey = (typeof PLAYER_INTEREST_OPTIONS)[number]["key"];

// The directory groups saved formats under broader surface and team-size filters.
const formatFilters: Record<
  (typeof interestCatalog.formats)[number]["key"],
  readonly InterestKey[]
> = {
  "indoor-6s": ["indoors", "6s"],
  "beach-2s": ["beach", "2s"],
  "9-man": ["9s"],
  "indoor-4s": ["indoors", "4s"],
  "beach-4s": ["beach", "4s"],
  "grass-4s": ["4s"],
};

export const PROFILE_FORMATS = interestCatalog.formats.map((format) => ({
  ...format,
  filters: formatFilters[format.key],
}));

export function getInterestTags(interests?: SavedInterests): Set<string> {
  const tags = new Set<string>();
  if (interests?.other?.includes("co-ed")) tags.add("mixed");
  for (const key of interests?.formats ?? []) {
    const format = PROFILE_FORMATS.find((option) => option.key === key);
    for (const tag of format?.filters ?? []) tags.add(tag);
  }
  return tags;
}

export function getSharedInterestKeys(interests?: SavedInterests): Set<string> {
  return new Set([
    ...(interests?.formats ?? []).map((key) => `format:${key}`),
    ...(interests?.positions ?? []).map((key) => `position:${key}`),
    ...(interests?.clubs ?? []).map((key) => `club:${key}`),
    ...(interests?.other ?? []).map((key) => `other:${key}`),
  ]);
}
