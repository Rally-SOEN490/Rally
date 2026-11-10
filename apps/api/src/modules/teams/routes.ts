// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import { createTeamRepository } from "./repository.ts";
import { signUpBody, tournamentParams } from "./schemas.ts";
import { createTeamService, type Accounts, type SignUpInput, type Tournaments } from "./service.ts";

// Teams in a tournament (docs/architecture/teams.md). Registered under
// /tournaments, next to the tournament routes.
export const teamRoutes: FastifyPluginAsync<{
  db: Database;
  verifyIdToken: VerifyIdToken;
  accounts: Accounts;
  tournaments: Tournaments;
}> = async (app, { db, verifyIdToken, accounts, tournaments }) => {
  const teams = createTeamService({ teams: createTeamRepository(db), accounts, tournaments });

  // Any logged-in account may sign up a team, the tournament's organizer included.
  app.addHook("preHandler", requireUser(verifyIdToken));

  // Creates a team in a division, with the caller as captain (RALLY-36).
  app.post<{ Params: { id: string }; Body: SignUpInput }>(
    "/:id/teams",
    { schema: { params: tournamentParams, body: signUpBody } },
    async (request, reply) =>
      reply
        .code(201)
        .send(await teams.signUp(request.firebaseUid, request.params.id, request.body)),
  );
};
