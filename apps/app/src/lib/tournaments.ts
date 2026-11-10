// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import { request } from "@/lib/api";
import {
  DIVISION_TYPES,
  FORMATS,
  LEVELS,
  type Division,
  type DivisionType,
  type Format,
  type Level,
  type OrganizerTournament,
} from "@/lib/organizer-tournaments";

// The player's side of tournaments: browsing published ones in Search (#302).
// (lib/organizer-tournaments.ts is the organizer's side.)

export type TournamentPriceRange = "under-50" | "50-100" | "100-150" | "150-plus";
export type TournamentDateRange = 7 | 30 | 90;

export type BrowseDivision = Division & { registeredTeams: number };

// A published tournament that hasn't ended. Times are Montreal times,
// "YYYY-MM-DDTHH:mm", whatever the phone's time zone.
export type Tournament = {
  id: string;
  name: string;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  organizerName: string;
  divisions: BrowseDivision[];
};

export type TournamentFilters = {
  dateRange?: TournamentDateRange;
  formats: Format[];
  types: DivisionType[];
  levels: Level[];
  priceRange?: TournamentPriceRange;
  spotsAvailable: boolean;
};

export const EMPTY_TOURNAMENT_FILTERS: TournamentFilters = {
  formats: [],
  types: [],
  levels: [],
  spotsAvailable: false,
};

// A copy with its own lists, so changing one filter set never changes another.
export const copyTournamentFilters = (filters: TournamentFilters): TournamentFilters => ({
  ...filters,
  formats: [...filters.formats],
  types: [...filters.types],
  levels: [...filters.levels],
});

export const DATE_RANGE_OPTIONS: TournamentDateRange[] = [7, 30, 90];
export const FORMAT_OPTIONS = FORMATS;
export const TYPE_OPTIONS = DIVISION_TYPES;
export const LEVEL_OPTIONS = LEVELS;
export const PRICE_RANGE_OPTIONS: TournamentPriceRange[] = [
  "under-50",
  "50-100",
  "100-150",
  "150-plus",
];

export const getTournaments = (user: User): Promise<Tournament[]> =>
  request(user, "GET", "/tournaments");

// ---------- A tournament's page (#301, #285) ----------

// Whether teams can sign up right now. The API works it out, so the app never
// compares Montreal times with the phone's clock.
export type SignUps = "NOT_OPEN" | "OPEN" | "CLOSED";

// The team the viewer is on in a tournament (RALLY-36).
export type MyTeam = {
  id: string;
  name: string;
  divisionId: string;
  divisionName: string;
  isCaptain: boolean;
};

// Anyone sees a published tournament's page. Its organizer also gets what they
// set up (status, courts, publishing date), and is the only one who sees a draft.
// Everyone gets the team they are on in it, or null.
export type TournamentPage =
  | (Tournament & {
      isOrganizer: false;
      signUps: SignUps;
      description: string | null;
      myTeam: MyTeam | null;
    })
  | (Omit<OrganizerTournament, "divisions"> & {
      isOrganizer: true;
      signUps: SignUps;
      organizerName: string;
      divisions: BrowseDivision[];
      myTeam: MyTeam | null;
    });

export const getTournamentPage = (user: User, id: string): Promise<TournamentPage> =>
  request(user, "GET", `/tournaments/${id}`);

// ---------- Signing up a team (RALLY-36) ----------

// The longest team name the API accepts.
export const TEAM_NAME_MAX_LENGTH = 40;

// "  Spike   Lee " becomes "Spike Lee", as the API stores it.
export const tidyTeamName = (name: string) => name.trim().replaceAll(/\s+/g, " ");

// Creates a team in a division with the caller as captain. Any account may.
export const signUpTeam = (
  user: User,
  tournamentId: string,
  team: { divisionId: string; name: string },
): Promise<MyTeam> => request(user, "POST", `/tournaments/${tournamentId}/teams`, team);

// ---------- What a card shows ----------

const spotsLeftIn = (division: BrowseDivision) =>
  Math.max(0, division.maxTeams - division.registeredTeams);

// One tournament's divisions, combined for its card: every format and type
// ("6v6 Co-ed"), every level, the lowest and highest price, and the spots left
// across all divisions.
export const summarizeDivisions = (divisions: BrowseDivision[]) => {
  const sorted = [...divisions].sort(
    (a, b) =>
      FORMATS.indexOf(a.format) - FORMATS.indexOf(b.format) ||
      DIVISION_TYPES.indexOf(a.type) - DIVISION_TYPES.indexOf(b.type),
  );
  const prices = divisions.map((division) => division.priceCents);
  return {
    formatsAndTypes: sorted
      .filter(
        (division, index) =>
          sorted.findIndex(
            (other) => other.format === division.format && other.type === division.type,
          ) === index,
      )
      .map(({ format, type }) => ({ format, type })),
    levels: LEVELS.filter((level) => divisions.some((division) => division.levels.includes(level))),
    lowestPriceCents: prices.length > 0 ? Math.min(...prices) : undefined,
    highestPriceCents: prices.length > 0 ? Math.max(...prices) : undefined,
    spotsLeft: divisions.reduce((sum, division) => sum + spotsLeftIn(division), 0),
    spotsTotal: divisions.reduce((sum, division) => sum + division.maxTeams, 0),
  };
};

// ---------- Search and filters ----------

export function getActiveTournamentFilterCount(filters: TournamentFilters) {
  return (
    Number(filters.dateRange !== undefined) +
    filters.formats.length +
    filters.types.length +
    filters.levels.length +
    Number(filters.priceRange !== undefined) +
    Number(filters.spotsAvailable)
  );
}

function matchesPriceRange(dollars: number, range: TournamentPriceRange) {
  switch (range) {
    case "under-50":
      return dollars < 50;
    case "50-100":
      return dollars >= 50 && dollars < 100;
    case "100-150":
      return dollars >= 100 && dollars < 150;
    case "150-plus":
      return dollars >= 150;
  }
}

function matchesSearch(tournament: Tournament, normalizedQuery: string) {
  return (
    !normalizedQuery ||
    [tournament.name, tournament.location, tournament.organizerName].some((value) =>
      value?.toLocaleLowerCase().includes(normalizedQuery),
    )
  );
}

// "YYYY-MM-DD" for a day, read in the phone's calendar.
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

// Starts between today and `dateRange` days from now. Compares calendar days,
// so the Montreal start time is never converted.
function matchesDateRange(
  tournament: Tournament,
  dateRange: TournamentDateRange | undefined,
  now: Date,
) {
  if (!dateRange) return true;
  if (!tournament.startsAt) return false;
  const lastDay = new Date(now);
  lastDay.setDate(lastDay.getDate() + dateRange);
  const startDay = tournament.startsAt.slice(0, 10);
  return startDay >= dayKey(now) && startDay <= dayKey(lastDay);
}

const matchesSelection = <T>(selected: T[], value: T) =>
  selected.length === 0 || selected.includes(value);

// Format, type, level, price and spots describe a division, so one division has
// to match all of them: "6v6" and "Under $50" don't match a tournament whose
// 6v6 costs $240 and whose cheap division is 2v2.
function matchesDivisionFilters(division: BrowseDivision, filters: TournamentFilters) {
  return (
    matchesSelection(filters.formats, division.format) &&
    matchesSelection(filters.types, division.type) &&
    (filters.levels.length === 0 ||
      division.levels.some((level) => filters.levels.includes(level))) &&
    (!filters.priceRange || matchesPriceRange(division.priceCents / 100, filters.priceRange)) &&
    (!filters.spotsAvailable || spotsLeftIn(division) > 0)
  );
}

const usesDivisionFilters = (filters: TournamentFilters) =>
  filters.formats.length > 0 ||
  filters.types.length > 0 ||
  filters.levels.length > 0 ||
  filters.priceRange !== undefined ||
  filters.spotsAvailable;

export function filterTournaments(
  tournaments: Tournament[],
  query: string,
  filters: TournamentFilters,
  now = new Date(),
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return tournaments.filter(
    (tournament) =>
      matchesSearch(tournament, normalizedQuery) &&
      matchesDateRange(tournament, filters.dateRange, now) &&
      (!usesDivisionFilters(filters) ||
        tournament.divisions.some((division) => matchesDivisionFilters(division, filters))),
  );
}
