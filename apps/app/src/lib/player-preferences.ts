// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { playerFilterCopy as copy } from "@/translations/player-filters.en";

export const PLAYER_LEVELS = ["C", "C+", "B-", "B"] as const;
export type SkillLevel = (typeof PLAYER_LEVELS)[number];
export type SavedInterests = {
  formats: string[];
  positions: string[];
  clubs?: string[];
  other?: string[];
};

export const PROFILE_FORMATS = [
  { key: "indoor-6s", label: copy.formats.indoor6s, filters: ["indoors", "6s"] },
  { key: "beach-2s", label: copy.formats.beach2s, filters: ["beach", "2s"] },
  { key: "9-man", label: copy.formats.nineMan, filters: ["9s"] },
  { key: "indoor-4s", label: copy.formats.indoor4s, filters: ["indoors", "4s"] },
  { key: "beach-4s", label: copy.formats.beach4s, filters: ["beach", "4s"] },
  { key: "grass-4s", label: copy.formats.grass4s, filters: ["4s"] },
] as const;
export const PLAYER_POSITIONS = [
  { key: "libero", label: copy.positions.libero },
  { key: "outside", label: copy.positions.outside },
  { key: "setter", label: copy.positions.setter },
  { key: "middle", label: copy.positions.middle },
  { key: "opposite", label: copy.positions.opposite },
] as const;
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
