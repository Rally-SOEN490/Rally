// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import { createTournamentRepository } from "./repository.ts";
import { signUpsAt } from "./rules.ts";

// What the tournaments module offers the teams module for a sign-up: locks a
// published tournament until the transaction ends, and says whether sign-ups
// are open and which divisions it has. app.ts passes it to the teams module.
export const createSignUpLookup = (db: Database) => {
  const tournaments = createTournamentRepository(db);
  return {
    lockForSignUp: async (
      tournamentId: string,
      now: Date,
      transaction: Prisma.TransactionClient,
    ) => {
      const tournament = await tournaments.lockForSignUp(tournamentId, transaction);
      return tournament && { signUps: signUpsAt(tournament, now), divisions: tournament.divisions };
    },
  };
};
