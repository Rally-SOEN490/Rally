// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

export type TournamentFormat = "Beach 4s" | "Grass 4s" | "Indoor 6s";
export type TournamentLevel = "Recreational" | "Intermediate" | "Competitive";
export type TournamentSurface = "Beach" | "Grass" | "Indoor";
export type TournamentTeamSize = 2 | 4 | 6;
export type TournamentPriceRange = "under-50" | "50-100" | "100-150" | "150-plus";
export type TournamentDateRange = 7 | 30 | 90;

export type Tournament = {
  id: string;
  name?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  organizer?: string | null;
  format?: TournamentFormat | null;
  level?: TournamentLevel | null;
  surface?: TournamentSurface | null;
  teamSize?: TournamentTeamSize | null;
  pricePerTeam?: number | null;
  spotsLeft?: number | null;
  spotsTotal?: number | null;
};

export type TournamentFilters = {
  dateRange?: TournamentDateRange;
  formats: TournamentFormat[];
  levels: TournamentLevel[];
  surfaces: TournamentSurface[];
  teamSizes: TournamentTeamSize[];
  priceRange?: TournamentPriceRange;
  spotsAvailable: boolean;
};

export const EMPTY_TOURNAMENT_FILTERS: TournamentFilters = {
  formats: [],
  levels: [],
  surfaces: [],
  teamSizes: [],
  spotsAvailable: false,
};

export const DATE_RANGE_OPTIONS: TournamentDateRange[] = [7, 30, 90];

export const FORMAT_OPTIONS: TournamentFormat[] = ["Beach 4s", "Grass 4s", "Indoor 6s"];
export const LEVEL_OPTIONS: TournamentLevel[] = ["Recreational", "Intermediate", "Competitive"];
export const SURFACE_OPTIONS: TournamentSurface[] = ["Beach", "Grass", "Indoor"];
export const TEAM_SIZE_OPTIONS: TournamentTeamSize[] = [2, 4, 6];
export const PRICE_RANGE_OPTIONS: TournamentPriceRange[] = [
  "under-50",
  "50-100",
  "100-150",
  "150-plus",
];

function daysFromToday(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const mockTournaments: Tournament[] = [
  {
    id: "montreal-spring-open",
    name: "Montreal Spring Open",
    date: daysFromToday(5),
    startTime: "9:00 AM",
    endTime: "5:00 PM",
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
    id: "concordia-fall-classic",
    name: "Concordia Fall Classic",
    date: daysFromToday(18),
    startTime: "8:30 AM",
    endTime: "6:00 PM",
    venue: "Concordia University Gym",
    organizer: "Concordia Recreation",
    format: "Indoor 6s",
    level: "Competitive",
    surface: "Indoor",
    teamSize: 6,
    pricePerTeam: 140,
    spotsLeft: 0,
    spotsTotal: 12,
  },
  {
    id: "laval-beach-invitational",
    name: "Laval Beach Invitational",
    date: daysFromToday(42),
    startTime: "10:00 AM",
    endTime: "4:00 PM",
    venue: "Centre de la Nature",
    organizer: "Laval Volley",
    format: "Grass 4s",
    level: "Recreational",
    surface: "Grass",
    teamSize: 4,
    pricePerTeam: 45,
    spotsLeft: 3,
    spotsTotal: 10,
  },
  {
    id: "open-gym-tournament",
    name: "Open Gym Tournament",
    date: daysFromToday(75),
    startTime: null,
    endTime: null,
    venue: null,
    organizer: "Rally Community",
    format: "Indoor 6s",
    level: "Recreational",
    surface: "Indoor",
    teamSize: 6,
    pricePerTeam: null,
    spotsLeft: null,
    spotsTotal: null,
  },
];

export async function getTournaments(): Promise<Tournament[]> {
  return mockTournaments.map((tournament) => ({ ...tournament }));
}

export function getActiveTournamentFilterCount(filters: TournamentFilters) {
  return (
    Number(filters.dateRange !== undefined) +
    filters.formats.length +
    filters.levels.length +
    filters.surfaces.length +
    filters.teamSizes.length +
    Number(filters.priceRange !== undefined) +
    Number(filters.spotsAvailable)
  );
}

function matchesPriceRange(price: number, range: TournamentPriceRange) {
  switch (range) {
    case "under-50":
      return price < 50;
    case "50-100":
      return price >= 50 && price < 100;
    case "100-150":
      return price >= 100 && price < 150;
    case "150-plus":
      return price >= 150;
  }
}

function matchesSearch(tournament: Tournament, normalizedQuery: string) {
  return (
    !normalizedQuery ||
    [tournament.name, tournament.venue, tournament.organizer].some((value) =>
      value?.toLocaleLowerCase().includes(normalizedQuery),
    )
  );
}

function matchesDateRange(
  tournament: Tournament,
  dateRange: TournamentDateRange | undefined,
  today: Date,
) {
  if (!dateRange) return true;
  if (!tournament.date) return false;
  const eventDate = new Date(`${tournament.date}T12:00:00`);
  const lastDay = new Date(today);
  lastDay.setDate(lastDay.getDate() + dateRange);
  return !Number.isNaN(eventDate.getTime()) && eventDate >= today && eventDate <= lastDay;
}

function matchesFilters(tournament: Tournament, filters: TournamentFilters, today: Date) {
  return (
    matchesDateRange(tournament, filters.dateRange, today) &&
    matchesSelection(filters.formats, tournament.format) &&
    matchesSelection(filters.levels, tournament.level) &&
    matchesSelection(filters.surfaces, tournament.surface) &&
    matchesSelection(filters.teamSizes, tournament.teamSize) &&
    matchesPriceSelection(tournament.pricePerTeam, filters.priceRange) &&
    (!filters.spotsAvailable ||
      (typeof tournament.spotsLeft === "number" && tournament.spotsLeft > 0))
  );
}

function matchesSelection<T>(selected: T[], value: T | null | undefined) {
  return (
    selected.length === 0 || (value !== null && value !== undefined && selected.includes(value))
  );
}

function matchesPriceSelection(
  price: number | null | undefined,
  range: TournamentPriceRange | undefined,
) {
  return !range || (typeof price === "number" && matchesPriceRange(price, range));
}

export function filterTournaments(
  tournaments: Tournament[],
  query: string,
  filters: TournamentFilters,
  now = new Date(),
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return tournaments.filter(
    (tournament) =>
      matchesSearch(tournament, normalizedQuery) && matchesFilters(tournament, filters, today),
  );
}
