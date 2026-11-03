// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { getInterestTags, getSharedInterestKeys } from "@/lib/player-preferences";
import type {
  InterestKey,
  PositionKey,
  SavedInterests,
  SkillLevel,
} from "@/lib/player-preferences";

export type PlayerFilters = {
  levels: SkillLevel[];
  positions: PositionKey[];
  interests: InterestKey[];
};
export type PlayerSort = "recommended" | "name";
export type SearchablePlayer = {
  id: string;
  displayName: string;
  skillLevel?: SkillLevel | null;
  interests?: SavedInterests;
};
export const emptyPlayerFilters = (): PlayerFilters => ({
  levels: [],
  positions: [],
  interests: [],
});
export const playerFilterCount = (filters: PlayerFilters) =>
  filters.levels.length + filters.positions.length + filters.interests.length;
export const clonePlayerFilters = (filters: PlayerFilters): PlayerFilters => ({
  levels: [...filters.levels],
  positions: [...filters.positions],
  interests: [...filters.interests],
});
export function togglePlayerFilter<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

function matchesPlayer(player: SearchablePlayer, query: string, filters: PlayerFilters) {
  const textMatches =
    !query ||
    [player.displayName, player.skillLevel].some((value) =>
      value?.toLocaleLowerCase().includes(query),
    );
  return (
    textMatches &&
    (filters.levels.length === 0 ||
      (player.skillLevel != null && filters.levels.includes(player.skillLevel))) &&
    (filters.positions.length === 0 ||
      filters.positions.some((value) => player.interests?.positions.includes(value))) &&
    (filters.interests.length === 0 ||
      filters.interests.some((value) => getInterestTags(player.interests).has(value)))
  );
}

function sharedInterestCount(player: SearchablePlayer, viewerKeys: Set<string>) {
  return [...getSharedInterestKeys(player.interests)].filter((key) => viewerKeys.has(key)).length;
}

// Work on a new array so sorting never reorders the loaded directory or another tab's data.
export function filterPlayers<T extends SearchablePlayer>(
  players: readonly T[],
  query: string,
  filters: PlayerFilters,
  sort: PlayerSort = "recommended",
  viewerInterests?: SavedInterests,
): T[] {
  const normalized = query.trim().toLocaleLowerCase();
  const viewerKeys = getSharedInterestKeys(viewerInterests);
  return players
    .filter((player) => matchesPlayer(player, normalized, filters))
    .sort((left, right) => {
      const relevance =
        sort === "recommended"
          ? sharedInterestCount(right, viewerKeys) - sharedInterestCount(left, viewerKeys)
          : 0;
      return (
        relevance ||
        left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" }) ||
        left.id.localeCompare(right.id)
      );
    });
}
