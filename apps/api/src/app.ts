// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import cors from "@fastify/cors";
import Fastify, { type FastifyError } from "fastify";
import type { VerifyIdToken } from "./auth.ts";
import type { Database } from "./db.ts";
import { healthRoutes } from "./health.ts";
import { participationRoutes } from "./modules/profile-participation/routes.ts";
import { messageRoutes } from "./modules/profile-message/routes.ts";
import { userRoutes } from "./modules/users/routes.ts";

export type AppOptions = {
  db: Database;
  verifyIdToken: VerifyIdToken;
  // Web addresses allowed to call the API from a browser.
  corsOrigins: string[];
  logger?: boolean;
};

// Builds the API without starting it, so tests can send it requests with app.inject().
export const buildApp = async ({
  db,
  verifyIdToken,
  corsOrigins,
  logger = false,
}: AppOptions) => {
  const app = Fastify({ logger });
  // Browsers only send the request methods listed here.
  await app.register(cors, { origin: corsOrigins, methods: ["GET", "POST", "PATCH", "DELETE"] });
  app.decorateRequest("firebaseUid", "");

  // The app shows `message` to the user, so keep it short and never send
  // internal details (database errors name our tables). The log keeps the details.
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation)
      return reply.code(400).send({ message: "Some of the details you sent aren't valid." });
    const statusCode = error.statusCode ?? 500;
    if (statusCode < 500) return reply.code(statusCode).send({ message: error.message });
    request.log.error(error);
    return reply
      .code(500)
      .send({ message: "Something went wrong on our side. Please try again." });
  });

  await app.register(healthRoutes, { db });
  await app.register(userRoutes, { db, verifyIdToken, prefix: "/users" });
  await app.register(messageRoutes, { db, verifyIdToken, prefix: "/profiles" });
  await app.register(participationRoutes, { db, verifyIdToken, prefix: "/profiles" });
  return app;
};
