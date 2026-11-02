// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import {
  EMPTY_TOURNAMENT_FILTERS,
  filterTournaments,
  type Tournament,
  type TournamentFilters,
} from "@/lib/tournaments";

const tournaments: Tournament[] = [
  {
    id: "one",
    name: "Montreal Open",
    date: "2026-11-07",
    venue: "Parc Jean-Drapeau",
    organizer: "Montreal Volleyball Club",
    format: "Beach 4s",
    level: "Intermediate",
    surface: "Beach",
    teamSize: 4,
    pricePerTeam: 80,
    spotsLeft: 8,
    spotsTotal: 16,
  },
  {
    id: "two",
    name: "Concordia Classic",
    date: "2026-11-20",
    venue: "Concordia Gym",
    organizer: "Campus Rec",
    format: "Indoor 6s",
    level: "Competitive",
    surface: "Indoor",
    teamSize: 6,
    pricePerTeam: 140,
    spotsLeft: 0,
    spotsTotal: 12,
  },
  { id: "three", name: "Missing Info", organizer: "Rally Community" },
];

const now = new Date("2026-11-02T12:00:00");

it("matches tournament name, venue, and organizer case-insensitively", () => {
  expect(filterTournaments(tournaments, " MONTREAL ", EMPTY_TOURNAMENT_FILTERS, now)).toEqual([
    tournaments[0],
  ]);
  expect(filterTournaments(tournaments, "jean-drapeau", EMPTY_TOURNAMENT_FILTERS, now)).toEqual([
    tournaments[0],
  ]);
  expect(filterTournaments(tournaments, "CAMPUS REC", EMPTY_TOURNAMENT_FILTERS, now)).toEqual([
    tournaments[1],
  ]);
});

it("combines all selected criteria with search and excludes missing values where required", () => {
  const filters: TournamentFilters = {
    ...EMPTY_TOURNAMENT_FILTERS,
    dateRange: 30,
    formats: ["Beach 4s"],
    levels: ["Intermediate"],
    surfaces: ["Beach"],
    teamSizes: [4],
    priceRange: "50-100",
    spotsAvailable: true,
  };
  const results = filterTournaments(tournaments, "parc", filters, now);
  expect(results.map(({ id }) => id)).toEqual(["one"]);
  expect(filterTournaments(tournaments, "concordia", filters, now)).toEqual([]);
  expect(filterTournaments(tournaments, "", { ...filters, priceRange: "under-50" }, now)).toEqual(
    [],
  );
  expect(
    filterTournaments(
      tournaments,
      "",
      { ...EMPTY_TOURNAMENT_FILTERS, spotsAvailable: true },
      now,
    ).map(({ id }) => id),
  ).toEqual(["one"]);
});
