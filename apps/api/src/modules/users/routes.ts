// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { FastifyPluginAsync } from "fastify";
import { fileTypeFromBuffer } from "file-type";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import type { ProfilePhotoStorage } from "./photo-storage.ts";
import { profilePhotoMaxBytes, profilePhotoTypes } from "./photo-storage.ts";
import { createUserRepository } from "./repository.ts";
import { createUserService } from "./service.ts";

type RegisterBody = { displayName: string; ageConfirmed: true };
type UpdateProfileBody = { displayName: string; bio: string };

export const userRoutes: FastifyPluginAsync<{
  db: Database;
  verifyIdToken: VerifyIdToken;
  photos?: ProfilePhotoStorage;
}> = async (app, { db, verifyIdToken, photos }) => {
  const users = createUserService(createUserRepository(db), photos);

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
    return user ?? reply.code(404).send({ message: "No Rally account found." });
  });

  app.patch<{ Body: UpdateProfileBody }>(
    "/me",
    {
      schema: {
        body: {
          type: "object",
          required: ["displayName", "bio"],
          additionalProperties: false,
          properties: {
            displayName: {
              type: "string",
              maxLength: 100,
              pattern: "^\\P{Cc}*[^\\s\\p{Cc}]\\P{Cc}*$",
            },
            bio: { type: "string", maxLength: 300 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await users.updateCurrent(
        request.firebaseUid,
        request.body.displayName,
        request.body.bio,
      );
      return user ?? reply.code(404).send({ message: "No Rally account found." });
    },
  );

  app.post("/me/photo", async (request, reply) => {
    if (!photos)
      return reply.code(503).send({ message: "Profile photo uploads are not configured." });
    const file = await request.file({ limits: { files: 1, fileSize: profilePhotoMaxBytes } });
    if (!file)
      return reply.code(400).send({ message: "Choose a profile photo to upload." });
    const body = await file.toBuffer();
    const detected = await fileTypeFromBuffer(body);
    if (!detected || !profilePhotoTypes.includes(detected.mime))
      return reply.code(400).send({ message: "Use a JPEG, PNG, or WebP image." });
    const user = await users.uploadPhoto(request.firebaseUid, body);
    return user ?? reply.code(404).send({ message: "No Rally account found." });
  });

  // Deletes the logged-in person's Rally data. The app then deletes their Firebase login.
  app.delete("/me", async (request, reply) => {
    await users.remove(request.firebaseUid);
    return reply.code(204).send();
  });
};
