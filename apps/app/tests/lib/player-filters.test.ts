// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { emptyPlayerFilters, filterPlayers, playerFilterCount } from "@/lib/player-filters";
import type { SearchablePlayer } from "@/lib/player-filters";
import { PLAYER_LEVELS, PLAYER_POSITIONS } from "@/lib/player-preferences";

const makePlayer = (changes: Partial<SearchablePlayer> = {}): SearchablePlayer => ({
  id: "1",
  displayName: "Alex Kim",
  skillLevel: "C",
  interests: { formats: ["indoor-6s"], positions: ["outside"], other: ["co-ed"] },
  ...changes,
});

it.each(PLAYER_LEVELS)("filters level %s independently", (level) => {
  const matching = makePlayer({ skillLevel: level });
  const other = makePlayer({ id: "other", skillLevel: level === "B" ? "C" : "B" });
  expect(
    filterPlayers([matching, other, makePlayer({ id: "unknown", skillLevel: null })], "", {
      ...emptyPlayerFilters(),
      levels: [level],
    }),
  ).toEqual([matching]);
});

it.each(PLAYER_POSITIONS)("filters position $label independently", ({ key }) => {
  const matching = makePlayer({ interests: { formats: [], positions: [key] } });
  const other = makePlayer({
    id: "other",
    interests: { formats: [], positions: [key === "outside" ? "opposite" : "outside"] },
  });
  expect(
    filterPlayers([matching, other, makePlayer({ id: "unknown", interests: undefined })], "", {
      ...emptyPlayerFilters(),
      positions: [key],
    }),
  ).toEqual([matching]);
});

it.each([
  ["beach", "beach-2s", undefined],
  ["indoors", "indoor-6s", undefined],
  ["9s", "9-man", undefined],
  ["6s", "indoor-6s", undefined],
  ["4s", "grass-4s", undefined],
  ["2s", "beach-2s", undefined],
  ["mixed", undefined, "mixed"],
] as const)("filters interest %s independently", (interest, format, competitionType) => {
  const matching = makePlayer({
    interests: {
      formats: format ? [format] : [],
      positions: [],
      other: competitionType ? ["co-ed"] : [],
    },
  });
  const missing = makePlayer({ id: "unknown", interests: undefined });
  expect(
    filterPlayers([matching, missing], "", { ...emptyPlayerFilters(), interests: [interest] }),
  ).toEqual([matching]);
});

it("combines OR within each group, AND across groups, and case-insensitive text", () => {
  const alex = makePlayer();
  const sam = makePlayer({
    id: "2",
    displayName: "Sam",
    skillLevel: "B",
    interests: { formats: ["beach-2s"], positions: ["setter"] },
  });
  const filters = {
    levels: ["C", "B"] as const,
    positions: ["outside", "setter"] as const,
    interests: ["indoors", "beach"] as const,
  };
  const selected = {
    levels: [...filters.levels],
    positions: [...filters.positions],
    interests: [...filters.interests],
  };
  expect(filterPlayers([alex, sam], "", selected)).toEqual([alex, sam]);
  expect(filterPlayers([alex, sam], "  ALEX ", selected)).toEqual([alex]);
  expect(filterPlayers([alex, sam], "b", selected)).toEqual([]);
  expect(filterPlayers([alex, sam], "", { ...selected, positions: ["libero"] })).toEqual([]);
});

it("returns unknown preferences unfiltered but excludes them when a value is required", () => {
  const unknown = makePlayer({ interests: undefined, skillLevel: undefined });
  expect(filterPlayers([unknown], "", emptyPlayerFilters())).toEqual([unknown]);
  expect(filterPlayers([unknown], "", { ...emptyPlayerFilters(), positions: ["setter"] })).toEqual(
    [],
  );
});

it("ranks by distinct saved shared interests, then name and ID, without mutating input", () => {
  const duplicate = makePlayer({
    id: "3",
    displayName: "Zoe",
    interests: { formats: ["beach-2s", "beach-2s"], positions: [] },
  });
  const best = makePlayer({
    id: "2",
    displayName: "Sam",
    interests: { formats: ["beach-2s"], positions: ["setter"] },
  });
  const tie = makePlayer({
    id: "1",
    displayName: "Sam",
    interests: { formats: ["beach-2s"], positions: ["setter"] },
  });
  const original = [duplicate, best, tie];
  const viewer = { formats: ["beach-2s"], positions: ["setter"] };
  expect(
    filterPlayers(original, "", emptyPlayerFilters(), "recommended", viewer).map(({ id }) => id),
  ).toEqual(["1", "2", "3"]);
  expect(original.map(({ id }) => id)).toEqual(["3", "2", "1"]);
});

it("offers alphabetical order independently of shared interests and stable ties without a viewer", () => {
  const alex = makePlayer();
  const zoe = makePlayer({
    id: "2",
    displayName: "Zoe",
    interests: { formats: ["beach-2s"], positions: ["setter"] },
  });
  expect(filterPlayers([zoe, alex], "", emptyPlayerFilters(), "name", zoe.interests)).toEqual([
    alex,
    zoe,
  ]);
  expect(filterPlayers([zoe, alex], "", emptyPlayerFilters())).toEqual([alex, zoe]);
});

it("counts selected values, rather than groups or results", () => {
  expect(
    playerFilterCount({ levels: ["C", "B"], positions: ["setter"], interests: ["beach", "2s"] }),
  ).toBe(5);
});

it("does not match a player's skill level as their name", () => {
  expect(
    filterPlayers(
      [makePlayer({ displayName: "Zoe Tran", skillLevel: "C" })],
      "c",
      emptyPlayerFilters(),
    ),
  ).toEqual([]);
});

it("ranks shared managed club and other interests without confusing categories", () => {
  const alex = makePlayer({
    id: "a",
    displayName: "Alex",
    interests: { formats: [], positions: [] },
  });
  const zoe = makePlayer({
    id: "z",
    displayName: "Zoe",
    interests: { formats: [], positions: [], clubs: ["ckvc"], other: ["co-ed"] },
  });
  expect(
    filterPlayers([alex, zoe], "", emptyPlayerFilters(), "recommended", zoe.interests),
  ).toEqual([zoe, alex]);
});
