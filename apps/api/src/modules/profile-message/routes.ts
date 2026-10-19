// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import { createMessageRepository } from "./repository.ts";
import { createMessageService } from "./service.ts";

export const messageRoutes: FastifyPluginAsync<{
  db: Database; verifyIdToken: VerifyIdToken;
}> = async (app, { db, verifyIdToken }) => {
  const messages = createMessageService(createMessageRepository(db));
  app.addHook("onRequest", async (_request, reply) => { reply.header("Cache-Control", "no-store"); });
  app.addHook("preHandler", requireUser(verifyIdToken));
  app.get("/me/message", (request) => messages.get(request.firebaseUid));
  app.patch<{ Body: unknown }>("/me/message", (request, reply) => {
    const body = request.body;
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).length !== 1 || !("message" in body) ||
        typeof body.message !== "string" || Array.from(body.message).length > 280 ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body.message)) {
      return reply.code(400).send({ message: "Enter a profile message of 280 characters or fewer." });
    }
    return messages.save(request.firebaseUid, body.message);
  });
};
