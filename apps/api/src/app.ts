// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import cors from "@fastify/cors";
import Fastify from "fastify";
import type { VerifyIdToken } from "./auth.ts";
import type { Database } from "./db.ts";
import { healthRoutes } from "./health.ts";
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
  await app.register(cors, { origin: corsOrigins, methods: ["GET", "POST", "DELETE"] });
  app.decorateRequest("firebaseUid", "");

  await app.register(healthRoutes, { db });
  await app.register(userRoutes, { db, verifyIdToken, prefix: "/users" });
  return app;
};
