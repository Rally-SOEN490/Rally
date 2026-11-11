// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import { requirePermission, type FindAccountRole } from "../../authorization.ts";
import type { Database } from "../../db.ts";
import type { Accounts, DivisionInput, Teams, TournamentInput } from "./mapping.ts";
import { createTournamentRepository } from "./repository.ts";
import {
  createDivisionBody,
  createTournamentBody,
  divisionParams,
  tournamentParams,
  updateDivisionBody,
  updateTournamentBody,
} from "./schemas.ts";
import { createTournamentService } from "./service.ts";

type Id = { Params: { id: string } };
type DivisionId = { Params: { id: string; divisionId: string } };
type TournamentService = ReturnType<typeof createTournamentService>;

// Adding, changing and removing a draft's divisions.
const registerDivisionRoutes = (app: FastifyInstance, tournaments: TournamentService) => {
  app.post<Id & { Body: DivisionInput }>(
    "/:id/divisions",
    { schema: { params: tournamentParams, body: createDivisionBody } },
    async (request, reply) =>
      reply
        .code(201)
        .send(await tournaments.addDivision(request.firebaseUid, request.params.id, request.body)),
  );

  app.patch<DivisionId & { Body: Partial<DivisionInput> }>(
    "/:id/divisions/:divisionId",
    { schema: { params: divisionParams, body: updateDivisionBody } },
    (request) =>
      tournaments.updateDivision(
        request.firebaseUid,
        request.params.id,
        request.params.divisionId,
        request.body,
      ),
  );

  app.delete<DivisionId>(
    "/:id/divisions/:divisionId",
    { schema: { params: divisionParams } },
    (request) =>
      tournaments.removeDivision(request.firebaseUid, request.params.id, request.params.divisionId),
  );
};

// Creating, setting up, publishing and deleting the caller's own tournaments.
// The service also checks the caller organizes the tournament they change.
const registerOrganizerRoutes = (app: FastifyInstance, tournaments: TournamentService) => {
  // Creates a draft. Only the name is required until it is published.
  app.post<{ Body: TournamentInput & { name: string } }>(
    "/",
    { schema: { body: createTournamentBody } },
    async (request, reply) =>
      reply.code(201).send(await tournaments.create(request.firebaseUid, request.body)),
  );

  // The caller's tournaments, for the Organizer section of the Events page.
  app.get("/mine", (request) => tournaments.listMine(request.firebaseUid));

  app.patch<Id & { Body: TournamentInput }>(
    "/:id",
    { schema: { params: tournamentParams, body: updateTournamentBody } },
    (request) => tournaments.update(request.firebaseUid, request.params.id, request.body),
  );

  registerDivisionRoutes(app, tournaments);

  // Deletes a draft and its divisions.
  app.delete<Id>("/:id", { schema: { params: tournamentParams } }, async (request, reply) => {
    await tournaments.deleteDraft(request.firebaseUid, request.params.id);
    return reply.code(204).send();
  });

  // Publishing makes it visible to players in Search.
  app.post<Id>("/:id/publish", { schema: { params: tournamentParams } }, (request) =>
    tournaments.publish(request.firebaseUid, request.params.id),
  );
};

export const tournamentRoutes: FastifyPluginAsync<{
  db: Database;
  verifyIdToken: VerifyIdToken;
  accounts: Accounts;
  teams: Teams;
  findRole: FindAccountRole;
}> = async (app, { db, verifyIdToken, accounts, teams, findRole }) => {
  const tournaments = createTournamentService({
    tournaments: createTournamentRepository(db),
    accounts,
    teams,
  });

  // Every route needs a logged-in account.
  app.addHook("preHandler", requireUser(verifyIdToken));

  // Published tournaments that haven't ended, for Search (#302). Any player may
  // browse them, so this needs no permission.
  app.get("/", () => tournaments.listPublished());

  // A tournament's page: any published one, or the caller's own draft.
  app.get<Id>("/:id", { schema: { params: tournamentParams } }, (request) =>
    tournaments.getPage(request.firebaseUid, request.params.id),
  );

  // The rest are for organizers and admins. Hooks added inside this register
  // only apply to the routes inside it.
  await app.register(async (organizer) => {
    organizer.addHook("preHandler", requirePermission(findRole, "tournament:create"));
    registerOrganizerRoutes(organizer, tournaments);
  });
};
