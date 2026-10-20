// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import { createParticipationRepository } from "./repository.ts";
import { createParticipationService } from "./service.ts";
export const participationRoutes: FastifyPluginAsync<{ db: Database; verifyIdToken: VerifyIdToken }> = async (app, { db, verifyIdToken }) => {
  const profiles = createParticipationService(createParticipationRepository(db));
  app.addHook("onRequest", async (_request, reply) => { reply.header("Cache-Control", "no-store"); });
  app.addHook("preHandler", requireUser(verifyIdToken));
  app.get("/me/upcoming", (request) => profiles.upcoming(request.firebaseUid));
};
