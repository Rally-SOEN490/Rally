// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import { createProfileRepository } from "./repository.ts";
import { createProfileService } from "./service.ts";
import { privacyKeys, privacyProperties, type PrivacyUpdate } from "./privacy.ts";

const errorSchema = { type: "object", required: ["message"], properties: { message: { type: "string" } } };
const privacySchema = {
  type: "object",
  additionalProperties: false,
  required: privacyKeys,
  properties: privacyProperties,
};

export const profileRoutes: FastifyPluginAsync<{ db: Database; verifyIdToken: VerifyIdToken }> =
  async (app, { db, verifyIdToken }) => {
    const profiles = createProfileService(createProfileRepository(db));
    app.addHook("preHandler", requireUser(verifyIdToken));
    // These responses depend on the caller and may change immediately after a save.
    app.addHook("onRequest", async (_request, reply) => {
      reply.header("Cache-Control", "private, no-store");
      reply.header("Vary", "Authorization");
    });

    app.get("/me/privacy", { schema: { response: { 200: privacySchema, 400: errorSchema, 404: errorSchema } } }, async (request, reply) => {
      const settings = await profiles.getPrivacy(request.firebaseUid);
      return settings ?? reply.code(404).send({ message: "No Rally account found." });
    });

    app.patch<{ Body: PrivacyUpdate }>("/me/privacy", {
      preValidation: async (request, reply) => {
        const body = request.body;
        if (body && typeof body === "object" && Object.entries(body).some(
          ([key, value]) => privacyKeys.includes(key as keyof PrivacyUpdate) && typeof value !== "boolean",
        )) return reply.code(400).send({ message: "Privacy preferences must be true or false." });
      },
      schema: {
        body: {
          type: "object", minProperties: 1, additionalProperties: false,
          properties: privacyProperties,
        },
        response: { 200: privacySchema, 400: errorSchema, 404: errorSchema },
      },
    }, async (request, reply) => {
      if (!Object.keys(request.body).length) return reply.code(400).send({ message: "Choose at least one privacy preference." });
      const settings = await profiles.savePrivacy(request.firebaseUid, request.body);
      return settings ?? reply.code(404).send({ message: "No Rally account found." });
    });
  };
