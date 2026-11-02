// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { FastifyPluginAsync } from "fastify";
import { fileTypeFromBuffer } from "file-type";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import type { ProfilePhotoStorage } from "./photo-storage.ts";
import { profilePhotoMaxBytes, profilePhotoTypes } from "./photo-storage.ts";
import { createUserRepository, type ProfileChanges } from "./repository.ts";
import { createUserService } from "./service.ts";
import {
  competitionTypes,
  interestFormats,
  interestPositions,
  skillLevels,
} from "./preferences.ts";

type RegisterBody = { displayName: string; ageConfirmed: true };
const languages = ["EN", "FR"] as const;
const colorThemes = ["green", "blue", "pink"] as const;

// At least one character that isn't a space, and no invisible control
// characters (PostgreSQL can't store some of them). Used at sign-up and when
// the name is changed in Settings.
const displayNameSchema = {
  type: "string",
  maxLength: 100,
  pattern: "^\\P{Cc}*[^\\s\\p{Cc}]\\P{Cc}*$",
} as const;

// Fields the app may change with PATCH /users/me.
const editableFields = [
  "displayName",
  "skillLevel",
  "lookingForTeam",
  "shownBadgeKeys",
  "instagramUrl",
  "facebookUrl",
  "thoughtText",
  "interests",
  "notificationsEnabled",
  "language",
  "colorTheme",
  "colorBlindMode",
  "darkMode",
] as const;

const noAccount = { message: "No Rally account found." };

export const userRoutes: FastifyPluginAsync<{
  db: Database;
  verifyIdToken: VerifyIdToken;
  photos?: ProfilePhotoStorage;
}> = async (app, { db, verifyIdToken, photos }) => {
  const users = createUserService(createUserRepository(db), photos);

  // Every route in this file needs a logged-in user.
  app.addHook("preHandler", requireUser(verifyIdToken));

  app.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {},
        },
      },
    },
    (request) => users.getDirectory(request.firebaseUid),
  );

  // Saves the logged-in person in Rally's database. The app calls this right after sign-up.
  app.post<{ Body: RegisterBody }>(
    "/me",
    {
      schema: {
        body: {
          type: "object",
          required: ["displayName", "ageConfirmed"],
          properties: {
            displayName: displayNameSchema,
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
      // Check the new array before AJV can coerce a single string into an array.
      preValidation: async (request, reply) => {
        const values = request.body?.interests?.competitionTypes;
        if (values !== undefined && !Array.isArray(values)) {
          return reply.code(400).send({ message: "Competition preferences must be an array." });
        }
      },
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          propertyNames: { enum: editableFields },
          // At least one field must be sent.
          anyOf: editableFields.map((field) => ({ required: [field] })),
          properties: {
            displayName: displayNameSchema,
            skillLevel: { enum: [...skillLevels, null] },
            lookingForTeam: { enum: [true, false] },
            shownBadgeKeys: {
              type: "array",
              maxItems: 4,
              uniqueItems: true,
              items: { type: "string", minLength: 1 },
            },
            instagramUrl: {
              anyOf: [
                { type: "null" },
                {
                  type: "string",
                  maxLength: 2048,
                  pattern: "^https://(www\\.)?instagram\\.com/[A-Za-z0-9._-]+/?(?:[?#].*)?$",
                },
              ],
            },
            facebookUrl: {
              anyOf: [
                { type: "null" },
                {
                  type: "string",
                  maxLength: 2048,
                  pattern: "^https://(www\\.)?facebook\\.com/[A-Za-z0-9._-]+/?(?:[?#].*)?$",
                },
              ],
            },
            thoughtText: {
              anyOf: [
                { type: "null" },
                {
                  type: "string",
                  maxLength: 180,
                  pattern: "^(?:\\P{Cc}|\\n|\\r)*$",
                },
              ],
            },
            interests: {
              type: "object",
              additionalProperties: false,
              required: ["formats", "positions"],
              properties: {
                formats: {
                  type: "array",
                  uniqueItems: true,
                  items: { enum: interestFormats },
                },
                positions: {
                  type: "array",
                  uniqueItems: true,
                  items: { enum: interestPositions },
                },
                competitionTypes: {
                  type: "array",
                  uniqueItems: true,
                  items: { enum: competitionTypes },
                },
              },
            },
            notificationsEnabled: { enum: [true, false] },
            language: { enum: languages },
            colorTheme: { enum: colorThemes },
            colorBlindMode: { enum: [true, false] },
            darkMode: { enum: [true, false] },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await users.update(request.firebaseUid, request.body);
      return user ?? reply.code(404).send(noAccount);
    },
  );

  app.delete("/me/photo", async (request, reply) => {
    if (!photos)
      return reply.code(503).send({ message: "Profile photo uploads are not configured." });
    const user = await users.removePhoto(request.firebaseUid);
    return user ?? reply.code(404).send({ message: "No Rally account found." });
  });

  app.post("/me/photo", async (request, reply) => {
    if (!photos)
      return reply.code(503).send({ message: "Profile photo uploads are not configured." });
    const file = await request.file({ limits: { files: 1, fileSize: profilePhotoMaxBytes } });
    if (!file) return reply.code(400).send({ message: "Choose a profile photo to upload." });
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
