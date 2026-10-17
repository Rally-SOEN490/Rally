// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { FastifyPluginAsync } from "fastify";
import type { Database } from "./db.ts";

export const healthRoutes: FastifyPluginAsync<{ db: Database }> = async (
  app,
  { db },
) => {
  // Lets you (and later the hosting service) check that the API is up and can reach the database.
  app.get("/health", async (request, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch (error) {
      request.log.error(error, "Health check could not reach the database");
      return reply.code(503).send({ status: "database unavailable" });
    }
  });
};
