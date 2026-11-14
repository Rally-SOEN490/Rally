// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { TeamRepository, Transaction } from "./repository.ts";
import { teamNameKey, tidyTeamName } from "./rules.ts";

// What this module needs from the users module, passed in by app.ts.
export type Accounts = {
  findAccount: (firebaseUid: string) => Promise<{ id: string } | null>;
};

// What this module needs from the tournaments module, passed in by app.ts.
export type Tournaments = {
  // Locks a published tournament until the transaction ends and says whether
  // sign-ups are open. Null if it doesn't exist or is a draft.
  lockForSignUp: (
    tournamentId: string,
    now: Date,
    transaction: Transaction,
  ) => Promise<{
    signUps: "NOT_OPEN" | "OPEN" | "CLOSED";
    divisions: { id: string; name: string; maxTeams: number }[];
  } | null>;
};

type Deps = {
  teams: TeamRepository;
  accounts: Accounts;
  tournaments: Tournaments;
  now: () => Date;
};

export type SignUpInput = { divisionId: string; name: string };

// Errors whose message the app shows; app.ts sends them with this status code.
const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

// Creates a team in a division and makes the caller its captain (RALLY-36).
// Every sign-up for a tournament locks it first, so they run one at a time:
// two captains can't both take the last spot, and the checks below can't go
// stale before the team is saved. The unique indexes back them up.
const signUp = async (
  deps: Deps,
  firebaseUid: string,
  tournamentId: string,
  input: SignUpInput,
) => {
  const account = await deps.accounts.findAccount(firebaseUid);
  if (!account) throw httpError(404, "No Rally account found.");
  const name = tidyTeamName(input.name);
  try {
    return await deps.teams.inTransaction(async (transaction) => {
      const tournament = await deps.tournaments.lockForSignUp(
        tournamentId,
        deps.now(),
        transaction,
      );
      if (!tournament) throw httpError(404, "Tournament not found.");
      if (tournament.signUps === "NOT_OPEN")
        throw httpError(409, "Sign-ups for this tournament haven't opened yet.");
      if (tournament.signUps === "CLOSED")
        throw httpError(409, "Sign-ups for this tournament are closed.");
      const division = tournament.divisions.find(({ id }) => id === input.divisionId);
      if (!division) throw httpError(404, "Division not found.");
      if (await deps.teams.isOnATeam(tournamentId, account.id, transaction))
        throw httpError(409, "You're already on a team in this tournament.");
      if ((await deps.teams.countInDivision(division.id, transaction)) >= division.maxTeams)
        throw httpError(409, "This division is full.");
      const nameKey = teamNameKey(name);
      if (await deps.teams.isNameTaken(tournamentId, nameKey, transaction)) throw nameTaken();
      const team = await deps.teams.createWithCaptain(
        { tournamentId, divisionId: division.id, name, nameKey },
        account.id,
        transaction,
      );
      return { ...team, divisionName: division.name, isCaptain: true };
    });
  } catch (error) {
    // Only reachable if the lock above were removed: the indexes still refuse it.
    if (isUniqueViolation(error))
      throw httpError(409, "That team name is taken, or you're already on a team here.");
    throw error;
  }
};

const nameTaken = () =>
  httpError(409, "Another team in this tournament already has that name. Pick another one.");

export const createTeamService = (dependencies: Omit<Deps, "now"> & { now?: () => Date }) => {
  const deps: Deps = { ...dependencies, now: dependencies.now ?? (() => new Date()) };
  return {
    signUp: (firebaseUid: string, tournamentId: string, input: SignUpInput) =>
      signUp(deps, firebaseUid, tournamentId, input),
  };
};
