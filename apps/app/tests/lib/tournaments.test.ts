// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import { request } from "@/lib/api";
import {
  EMPTY_TOURNAMENT_FILTERS,
  copyTournamentFilters,
  filterTournaments,
  getActiveTournamentFilterCount,
  getTournaments,
  summarizeDivisions,
  type BrowseDivision,
  type Tournament,
  type TournamentFilters,
} from "@/lib/tournaments";

jest.mock("@/lib/api", () => ({ request: jest.fn() }));

const division = (overrides: Partial<BrowseDivision>): BrowseDivision => ({
  id: "division",
  name: "Division",
  format: "6v6",
  type: "coed",
  levels: ["B"],
  maxTeams: 16,
  priceCents: 8000,
  registeredTeams: 0,
  ...overrides,
});

const tournament = (overrides: Partial<Tournament>): Tournament => ({
  id: "tournament",
  name: "Tournament",
  location: "Somewhere",
  startsAt: "2026-11-07T09:00",
  endsAt: "2026-11-07T17:00",
  registrationOpensAt: "2026-10-01T09:00",
  registrationClosesAt: "2026-11-05T23:59",
  organizerName: "Organizer",
  divisions: [division({})],
  ...overrides,
});

const tournaments: Tournament[] = [
  tournament({
    id: "one",
    name: "Montreal Open",
    location: "Parc Jean-Drapeau",
    organizerName: "Montreal Volleyball Club",
    startsAt: "2026-11-07T09:00",
    divisions: [
      division({
        format: "4v4",
        levels: ["B"],
        priceCents: 8000,
        maxTeams: 16,
        registeredTeams: 8,
      }),
    ],
  }),
  tournament({
    id: "two",
    name: "Concordia Classic",
    location: "Concordia Gym",
    organizerName: "Campus Rec",
    startsAt: "2026-11-20T08:30",
    divisions: [
      division({
        type: "men",
        levels: ["A"],
        priceCents: 14000,
        maxTeams: 12,
        registeredTeams: 12,
      }),
    ],
  }),
  // Two divisions: an open 6v6 that costs $240, and a full 2v2 that costs $40.
  tournament({
    id: "three",
    name: "Verdun Mixed Cup",
    location: "Verdun Auditorium",
    organizerName: "Verdun Volley",
    startsAt: "2026-12-20T09:00",
    divisions: [
      division({ format: "6v6", levels: ["B+"], priceCents: 24000, maxTeams: 10 }),
      division({
        format: "2v2",
        type: "women",
        levels: ["C"],
        priceCents: 4000,
        maxTeams: 8,
        registeredTeams: 8,
      }),
    ],
  }),
];

const now = new Date("2026-11-02T12:00:00");

const ids = (filters: Partial<TournamentFilters>, query = "") =>
  filterTournaments(tournaments, query, { ...EMPTY_TOURNAMENT_FILTERS, ...filters }, now).map(
    ({ id }) => id,
  );

it("loads published tournaments from the API", async () => {
  const user = {} as User;
  jest.mocked(request).mockResolvedValueOnce([tournaments[0]]);

  await expect(getTournaments(user)).resolves.toEqual([tournaments[0]]);
  expect(request).toHaveBeenCalledWith(user, "GET", "/tournaments");
});

it("matches the name, location and organizer, ignoring case", () => {
  expect(ids({}, " MONTREAL ")).toEqual(["one"]);
  expect(ids({}, "jean-drapeau")).toEqual(["one"]);
  expect(ids({}, "CAMPUS REC")).toEqual(["two"]);
  expect(ids({}, "verdun volley")).toEqual(["three"]);
});

it("filters by start date", () => {
  expect(ids({ dateRange: 7 })).toEqual(["one"]);
  expect(ids({ dateRange: 30 })).toEqual(["one", "two"]);
  expect(ids({ dateRange: 90 })).toEqual(["one", "two", "three"]);
});

it("reads the Montreal start date as written, even late at night", () => {
  const lastDay = tournament({ id: "last", startsAt: "2026-11-09T23:30" });
  const dayAfter = tournament({ id: "after", startsAt: "2026-11-10T00:30" });

  expect(
    filterTournaments(
      [lastDay, dayAfter],
      "",
      { ...EMPTY_TOURNAMENT_FILTERS, dateRange: 7 },
      now,
    ).map(({ id }) => id),
  ).toEqual(["last"]);
});

it("filters by format, type and level", () => {
  expect(ids({ formats: ["6v6"] })).toEqual(["two", "three"]);
  expect(ids({ types: ["women"] })).toEqual(["three"]);
  expect(ids({ levels: ["B"] })).toEqual(["one"]);
});

it("matches any of several options within one filter", () => {
  expect(ids({ formats: ["4v4", "2v2"] })).toEqual(["one", "three"]);
  expect(ids({ levels: ["A", "C"] })).toEqual(["two", "three"]);
});

it("filters by any division's price per team", () => {
  expect(ids({ priceRange: "under-50" })).toEqual(["three"]);
  expect(ids({ priceRange: "50-100" })).toEqual(["one"]);
  expect(ids({ priceRange: "100-150" })).toEqual(["two"]);
  expect(ids({ priceRange: "150-plus" })).toEqual(["three"]);
});

it("keeps only tournaments with a division that still has spots", () => {
  expect(ids({ spotsAvailable: true })).toEqual(["one", "three"]);
});

it("needs one division to match every division filter, not one filter each", () => {
  // Tournament three has a 6v6 and a division under $50, but its 6v6 costs $240.
  expect(ids({ formats: ["6v6"], priceRange: "under-50" })).toEqual([]);
  // Its 2v2 is full.
  expect(ids({ formats: ["2v2"], spotsAvailable: true })).toEqual([]);
  expect(ids({ formats: ["6v6"], spotsAvailable: true })).toEqual(["three"]);
});

it("combines text search, date and division filters", () => {
  const filters: Partial<TournamentFilters> = {
    dateRange: 90,
    formats: ["6v6"],
    types: ["coed"],
    spotsAvailable: true,
  };

  expect(ids(filters, "verdun")).toEqual(["three"]);
  expect(ids(filters, "montreal")).toEqual([]);
});

it("still lists a tournament without divisions when no division filter is on", () => {
  const empty = tournament({ id: "empty", divisions: [] });

  expect(filterTournaments([empty], "", EMPTY_TOURNAMENT_FILTERS, now)).toEqual([empty]);
  expect(
    filterTournaments([empty], "", { ...EMPTY_TOURNAMENT_FILTERS, formats: ["6v6"] }, now),
  ).toEqual([]);
});

it("counts each active filter", () => {
  expect(getActiveTournamentFilterCount(EMPTY_TOURNAMENT_FILTERS)).toBe(0);
  expect(
    getActiveTournamentFilterCount({
      dateRange: 30,
      formats: ["6v6", "4v4"],
      types: ["coed"],
      levels: ["B"],
      priceRange: "under-50",
      spotsAvailable: true,
    }),
  ).toBe(7);
});

it("copies filters without sharing their lists", () => {
  const original = copyTournamentFilters(EMPTY_TOURNAMENT_FILTERS);
  const copy = copyTournamentFilters(original);
  copy.formats.push("6v6");

  expect(original.formats).toEqual([]);
  expect(EMPTY_TOURNAMENT_FILTERS.formats).toEqual([]);
});

it("summarizes a tournament's divisions for its card", () => {
  expect(summarizeDivisions(tournaments[2].divisions)).toEqual({
    formatsAndTypes: [
      { format: "2v2", type: "women" },
      { format: "6v6", type: "coed" },
    ],
    levels: ["C", "B+"],
    lowestPriceCents: 4000,
    highestPriceCents: 24000,
    spotsLeft: 10,
    spotsTotal: 18,
  });
});

it("lists a repeated format and type once", () => {
  const divisions = [
    division({ levels: ["A"], registeredTeams: 20 }),
    division({ levels: ["C"], maxTeams: 4 }),
  ];

  expect(summarizeDivisions(divisions)).toMatchObject({
    formatsAndTypes: [{ format: "6v6", type: "coed" }],
    levels: ["C", "A"],
    // More registered than allowed never counts as negative spots.
    spotsLeft: 4,
    spotsTotal: 20,
  });
});
