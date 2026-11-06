// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import type { Href } from "expo-router";
import { request } from "@/lib/api";

// The organizer's side of tournaments: creating, setting up and publishing.
// (lib/tournaments.ts is the player side: browsing published tournaments in Search.)

export const FORMATS = ["2v2", "3v3", "4v4", "6v6", "9v9"] as const;
export const DIVISION_TYPES = ["coed", "men", "women"] as const;
export const LEVELS = ["C-", "C", "C+", "B", "B+", "A", "Open", "Elite"] as const;

export type Format = (typeof FORMATS)[number];
export type DivisionType = (typeof DIVISION_TYPES)[number];
export type Level = (typeof LEVELS)[number];

export const LIMITS = {
  nameMaxLength: 100,
  locationMaxLength: 200,
  descriptionMaxLength: 5000,
  divisionNameMaxLength: 60,
  minCourts: 1,
  maxCourts: 50,
  minTeams: 2,
  maxTeams: 64,
  maxPriceCents: 1_000_000,
} as const;

export type Division = {
  id: string;
  name: string;
  format: Format;
  type: DivisionType;
  levels: Level[];
  maxTeams: number;
  priceCents: number;
};

// Times are Montreal times, "YYYY-MM-DDTHH:mm", whatever the phone's time zone.
export type OrganizerTournament = {
  id: string;
  status: "DRAFT" | "PUBLISHED";
  name: string;
  location: string | null;
  courts: number | null;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  publishedAt: string | null;
  divisions: Division[];
  registeredTeams: number;
};

export type SetupFields = Pick<
  OrganizerTournament,
  | "name"
  | "location"
  | "courts"
  | "description"
  | "startsAt"
  | "endsAt"
  | "registrationOpensAt"
  | "registrationClosesAt"
>;

export type DivisionFields = Omit<Division, "id">;

export const getMyTournaments = (user: User): Promise<OrganizerTournament[]> =>
  request(user, "GET", "/tournaments/mine");

export const getTournament = (user: User, id: string): Promise<OrganizerTournament> =>
  request(user, "GET", `/tournaments/${id}`);

export const createTournament = (user: User, fields: SetupFields): Promise<OrganizerTournament> =>
  request(user, "POST", "/tournaments", fields);

export const updateTournament = (
  user: User,
  id: string,
  fields: SetupFields,
): Promise<OrganizerTournament> => request(user, "PATCH", `/tournaments/${id}`, fields);

export const addDivision = (
  user: User,
  id: string,
  fields: DivisionFields,
): Promise<OrganizerTournament> => request(user, "POST", `/tournaments/${id}/divisions`, fields);

export const updateDivision = (
  user: User,
  id: string,
  divisionId: string,
  fields: DivisionFields,
): Promise<OrganizerTournament> =>
  request(user, "PATCH", `/tournaments/${id}/divisions/${divisionId}`, fields);

export const removeDivision = (
  user: User,
  id: string,
  divisionId: string,
): Promise<OrganizerTournament> =>
  request(user, "DELETE", `/tournaments/${id}/divisions/${divisionId}`);

export const publishTournament = (user: User, id: string): Promise<OrganizerTournament> =>
  request(user, "POST", `/tournaments/${id}/publish`);

// ---------- Helpers ----------

const levelIndex = (level: Level) => LEVELS.indexOf(level);

// "6v6 Co-ed B / B+": what most organizers call a division.
export const suggestDivisionName = (
  format: Format,
  type: DivisionType,
  levels: Level[],
  typeLabels: Record<DivisionType, string>,
) =>
  [format, typeLabels[type], [...levels].sort((a, b) => levelIndex(a) - levelIndex(b)).join(" / ")]
    .filter(Boolean)
    .join(" ");

// Cents to "$240" or "$12.50".
export const formatPrice = (cents: number) =>
  `$${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`;

// "$240", "240" or "12.50" to cents; undefined when it isn't a price.
export const parsePrice = (text: string): number | undefined => {
  const match = /^\$?\s*(\d{1,5})(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) return undefined;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
};

// Splits "2026-11-15T09:00" into its date and time, and joins them back.
export const splitDateTime = (value: string | null) => ({
  date: value?.slice(0, 10) ?? null,
  time: value?.slice(11, 16) ?? null,
});
export const joinDateTime = (date: string | null, time: string | null) =>
  date && time ? `${date}T${time}` : null;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Reads the parts of a Montreal time without converting it to the phone's time zone.
export const dateParts = (value: string) => ({
  year: Number(value.slice(0, 4)),
  month: MONTHS[Number(value.slice(5, 7)) - 1],
  day: Number(value.slice(8, 10)),
});

// "2026-11-15" to "Nov 15, 2026"; "09:00" to "9:00 AM".
export const formatDate = (date: string) => {
  const { year, month, day } = dateParts(date);
  return `${month} ${day}, ${year}`;
};
export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
};

// Addresses of the tournament setup screens. Typed as Href because Expo Router
// only adds new screens to its generated route types when `expo start` runs.
export const tournamentPaths = {
  new: "/tournaments/new" as Href,
  setup: (id: string) => `/tournaments/${id}/setup` as Href,
  divisions: (id: string) => `/tournaments/${id}/divisions` as Href,
};

// Deletes a draft and its divisions. Published tournaments can't be deleted (#81 is cancelling).
export const deleteTournament = async (user: User, id: string): Promise<void> => {
  await request(user, "DELETE", `/tournaments/${id}`);
};
