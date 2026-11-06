// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Helpers for the tournament service: turning API input into stored fields and
// back, the shared checks, and the errors the app shows.

import type { Prisma } from "../../generated/prisma/client.ts";
import type { AccountRole } from "../../permissions.ts";
import {
  formatName,
  formats,
  levelName,
  levelOrder,
  levels,
  typeName,
  types,
  type FormatName,
  type LevelName,
  type TypeName,
} from "./catalog.ts";
import { fromMontrealTime, toMontrealTime } from "./montreal-time.ts";
import type { DivisionFields, TournamentFields, TournamentRepository } from "./repository.ts";
import { dateProblems } from "./rules.ts";

// What this module needs from the users module, passed in by app.ts.
export type Accounts = {
  findAccount: (firebaseUid: string) => Promise<{ id: string; role: AccountRole } | null>;
};

// The fields the API accepts. Times are Montreal times, "YYYY-MM-DDTHH:mm".
export type TournamentInput = {
  name?: string;
  location?: string | null;
  courts?: number | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
};

export type DivisionInput = {
  name: string;
  format: FormatName;
  type: TypeName;
  levels: LevelName[];
  maxTeams: number;
  priceCents: number;
};

type Stored = NonNullable<Awaited<ReturnType<TournamentRepository["findById"]>>>;
export type Deps = { tournaments: TournamentRepository; accounts: Accounts; now: () => Date };

// Errors whose message the app shows; app.ts sends them with this status code.
const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

const notFound = () => httpError(404, "Tournament not found.");

const montreal = (moment: Date | null) => (moment ? toMontrealTime(moment) : null);

const toDivisionResponse = (division: Stored["divisions"][number]) => ({
  id: division.id,
  name: division.name,
  format: formatName[division.format],
  type: typeName[division.type],
  levels: division.levels
    .map((level) => levelName[level])
    .sort((a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b)),
  maxTeams: division.maxTeams,
  priceCents: division.priceCents,
});

const toResponse = (tournament: Stored) => ({
  id: tournament.id,
  status: tournament.status,
  name: tournament.name,
  location: tournament.location,
  courts: tournament.courts,
  description: tournament.description,
  startsAt: montreal(tournament.startsAt),
  endsAt: montreal(tournament.endsAt),
  registrationOpensAt: montreal(tournament.registrationOpensAt),
  registrationClosesAt: montreal(tournament.registrationClosesAt),
  publishedAt: tournament.publishedAt?.toISOString() ?? null,
  divisions: tournament.divisions.map(toDivisionResponse),
  // Teams can't register yet (#58), so this is 0 until then.
  registeredTeams: 0,
});

export type TournamentResponse = ReturnType<typeof toResponse>;

type Published = Stored & { organizer: { displayName: string } };

// What any signed-in player sees of a published tournament in Search. Leaves out
// the organizer's account and the draft-only fields (status, courts, description).
const toPublishedResponse = (tournament: Published) => ({
  id: tournament.id,
  name: tournament.name,
  location: tournament.location,
  startsAt: montreal(tournament.startsAt),
  endsAt: montreal(tournament.endsAt),
  registrationOpensAt: montreal(tournament.registrationOpensAt),
  registrationClosesAt: montreal(tournament.registrationClosesAt),
  organizerName: tournament.organizer.displayName,
  // Teams can't register yet (#58), so every division has all its spots left.
  divisions: tournament.divisions.map((division) => ({
    ...toDivisionResponse(division),
    registeredTeams: 0,
  })),
});

const timeFields = ["startsAt", "endsAt", "registrationOpensAt", "registrationClosesAt"] as const;

// Turns API input into stored fields: trims text, converts Montreal times.
const toFields = (input: TournamentInput): TournamentFields => {
  const fields: TournamentFields = {};
  if (input.name !== undefined) fields.name = input.name.trim();
  if (input.location !== undefined) fields.location = input.location?.trim() || null;
  if (input.courts !== undefined) fields.courts = input.courts;
  // Kept exactly as typed, so indentation and blank lines survive; only an all-blank text is cleared.
  if (input.description !== undefined)
    fields.description = input.description?.trim() ? input.description : null;
  for (const field of timeFields) {
    const value = input[field];
    if (value === undefined) continue;
    const moment = value === null ? null : fromMontrealTime(value);
    if (value !== null && !moment)
      throw httpError(400, `${value.replace("T", " ")} isn't a valid date and time in Montreal.`);
    fields[field] = moment;
  }
  return fields;
};

const checkDates = (current: TournamentFields, changes: TournamentFields) => {
  const pick = (field: (typeof timeFields)[number]) =>
    changes[field] !== undefined ? changes[field]! : (current[field] ?? null);
  const problems = dateProblems({
    startsAt: pick("startsAt"),
    endsAt: pick("endsAt"),
    registrationOpensAt: pick("registrationOpensAt"),
    registrationClosesAt: pick("registrationClosesAt"),
  });
  if (problems.length > 0) throw httpError(400, problems.join(" "));
};

const toDivisionFields = (input: Partial<DivisionInput>): Partial<DivisionFields> => ({
  ...(input.name !== undefined && { name: input.name.trim() }),
  ...(input.format !== undefined && { format: formats[input.format] }),
  ...(input.type !== undefined && { type: types[input.type] }),
  ...(input.levels !== undefined && { levels: input.levels.map((level) => levels[level]) }),
  ...(input.maxTeams !== undefined && { maxTeams: input.maxTeams }),
  ...(input.priceCents !== undefined && { priceCents: input.priceCents }),
});

const findAccountId = async (deps: Deps, firebaseUid: string) => {
  const account = await deps.accounts.findAccount(firebaseUid);
  if (!account) throw httpError(404, "No Rally account found.");
  return account.id;
};

// Inside a transaction: locks the tournament and checks the caller organizes it
// and it is still a draft. Someone else's tournament answers "not found", so
// nobody learns that a draft exists.
const lockOwnDraft = async (
  deps: Deps,
  organizerId: string,
  tournamentId: string,
  transaction: Prisma.TransactionClient,
) => {
  const locked = await deps.tournaments.lock(tournamentId, transaction);
  if (!locked || locked.organizerId !== organizerId) throw notFound();
  if (locked.status !== "DRAFT")
    throw httpError(409, "This tournament is published. Editing it isn't available yet.");
};

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

const duplicateDivisionName = () =>
  httpError(409, "This tournament already has a division with that name.");

export { httpError, lockOwnDraft, findAccountId, toFields, checkDates, toResponse };
// Whether teams can sign up right now, so the app never has to compare
// Montreal times with the phone's clock.
export type SignUps = "NOT_OPEN" | "OPEN" | "CLOSED";

const signUpsAt = (tournament: Stored, now: Date): SignUps => {
  const { registrationOpensAt: opens, registrationClosesAt: closes } = tournament;
  if (!opens || !closes || now < opens) return "NOT_OPEN";
  return now < closes ? "OPEN" : "CLOSED";
};

// A tournament's page. Its organizer gets everything they set up (status,
// courts, publishing date), like their other routes; anyone else gets what
// Search sends, plus the description.
const toPageResponse = (tournament: Published, isOrganizer: boolean, now: Date) => {
  const published = toPublishedResponse(tournament);
  const shared = {
    isOrganizer,
    signUps: signUpsAt(tournament, now),
    description: tournament.description,
  };
  return isOrganizer
    ? {
        ...toResponse(tournament),
        organizerName: published.organizerName,
        divisions: published.divisions,
        ...shared,
      }
    : { ...published, ...shared };
};

export { toPublishedResponse, toPageResponse };
export { toDivisionFields, isUniqueViolation, duplicateDivisionName, notFound };
export type { Stored };
