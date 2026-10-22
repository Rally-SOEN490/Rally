// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import { createUserRepository, type ProfileChanges } from "./repository.ts";
import { createUserService } from "./service.ts";
import type { Gender } from "./service.ts";

type RegisterBody = { displayName: string; ageConfirmed: true };
type GenderBody = { gender: Gender | null };

const noAccount = { message: "No Rally account found." };

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
            // At least one character that isn't a space, and no invisible
            // control characters (PostgreSQL can't store some of them).
            displayName: {
              type: "string",
              maxLength: 100,
              pattern: "^\\P{Cc}*[^\\s\\p{Cc}]\\P{Cc}*$",
            },
            ageConfirmed: { const: true },
          },
        },
      },
    },
    (request) => users.register(request.firebaseUid, request.body.displayName),
  );

  app.get("/me", async (request, reply) => {
    const user = await users.getCurrent(request.firebaseUid);
    return user ?? reply.code(404).send(noAccount);
  });

  app.patch<{ Body: ProfileChanges }>(
    "/me",
    {
      schema: {
        body: {
          type: "object",
          required: ["lookingForTeam"],
          // additionalProperties: false would make Fastify drop other fields instead of rejecting them.
          propertyNames: { const: "lookingForTeam" },
          properties: {
            // type: "boolean" would let Fastify turn "true" or 1 into true.
            lookingForTeam: { enum: [true, false] },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await users.update(request.firebaseUid, request.body);
      return user ?? reply.code(404).send(noAccount);
    },
  );

  app.get("/me/gender", async (request, reply) => {
    const gender = await users.getGender(request.firebaseUid);
    if (gender === null) {
      const account = await users.getCurrent(request.firebaseUid);
      if (!account) return reply.code(404).send(noAccount);
    }
    return { gender };
  });

  app.patch<{ Body: GenderBody }>(
    "/me/gender",
    {
      schema: {
        body: {
          type: "object",
          required: ["gender"],
          properties: {
            gender: { anyOf: [{ type: "string", enum: ["male", "female"] }, { type: "null" }] },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await users.getCurrent(request.firebaseUid);
      if (!account) return reply.code(404).send(noAccount);
      return { gender: await users.setGender(request.firebaseUid, request.body.gender) };
    },
  );

  // Deletes the logged-in person's Rally data. The app then deletes their Firebase login.
  app.delete("/me", async (request, reply) => {
    await users.remove(request.firebaseUid);
    return reply.code(204).send();
  });
};
