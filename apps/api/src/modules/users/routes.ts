// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import { createUserRepository } from "./repository.ts";
import { createUserService } from "./service.ts";

type RegisterBody = { displayName: string; ageConfirmed: true };

export const userRoutes: FastifyPluginAsync<{
  db: Database;
  verifyIdToken: VerifyIdToken;
}> = async (app, { db, verifyIdToken }) => {
  const users = createUserService(createUserRepository(db));

  // Every route in this file needs a logged-in user.
  app.addHook("preHandler", requireUser(verifyIdToken));

  // Saves the logged-in person in Rally's database. The app calls this right after sign-up.
  app.post<{ Body: RegisterBody }>(
    "/me",
    {
      schema: {
        body: {
          type: "object",
          required: ["displayName", "ageConfirmed"],
          properties: {
            // At least one character that isn't a space.
            displayName: { type: "string", maxLength: 100, pattern: "\\S" },
            ageConfirmed: { const: true },
          },
        },
      },
    },
    (request) => users.register(request.firebaseUid, request.body.displayName),
  );

  app.get("/me", async (request, reply) => {
    const user = await users.getCurrent(request.firebaseUid);
    return user ?? reply.code(404).send({ message: "No Rally account found." });
  });
};
