// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify, { type FastifyError } from "fastify";
import type { VerifyIdToken } from "./auth.ts";
import type { Database } from "./db.ts";
import type { ProfilePhotoStorage } from "./modules/users/photo-storage.ts";
import { healthRoutes } from "./health.ts";
import { organizerApplicationRoutes } from "./modules/organizer-applications/routes.ts";
import { createTeamLookup } from "./modules/teams/lookup.ts";
import { teamRoutes } from "./modules/teams/routes.ts";
import { tournamentRoutes } from "./modules/tournaments/routes.ts";
import { createSignUpLookup } from "./modules/tournaments/sign-up-lookup.ts";
import { createUserRepository } from "./modules/users/repository.ts";
import { userRoutes } from "./modules/users/routes.ts";

export type AppOptions = {
  db: Database;
  verifyIdToken: VerifyIdToken;
  // Web addresses allowed to call the API from a browser.
  corsOrigins: string[];
  photos?: ProfilePhotoStorage;
  logger?: boolean;
  organizerApplications?: {
    // Who is emailed each application.
    reviewerEmails: string[];
    // The web app's address, for the review link.
    appUrl: string;
    // Sends queued emails now instead of waiting for the next check.
    onEmailsQueued?: () => void;
  };
};

// Builds the API without starting it, so tests can send it requests with app.inject().
export const buildApp = async ({
  db,
  verifyIdToken,
  corsOrigins,
  photos,
  logger = false,
  organizerApplications = { reviewerEmails: [], appUrl: "http://localhost:8081" },
}: AppOptions) => {
  const app = Fastify({ logger });
  // Browsers only send the request methods listed here.
  await app.register(cors, { origin: corsOrigins, methods: ["GET", "POST", "PATCH", "DELETE"] });
  await app.register(multipart, { limits: { files: 1, fileSize: 5 * 1024 * 1024 } });
  app.decorateRequest("firebaseUid", "");

  // The app shows `message` to the user, so keep it short and never send
  // internal details (database errors name our tables). The log keeps the details.
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation)
      return reply.code(400).send({ message: "Some of the details you sent aren't valid." });
    const statusCode = error.statusCode ?? 500;
    if (statusCode < 500) return reply.code(statusCode).send({ message: error.message });
    request.log.error(error);
    return reply.code(500).send({ message: "Something went wrong on our side. Please try again." });
  });

  await app.register(healthRoutes, { db });
  await app.register(userRoutes, { db, verifyIdToken, photos, prefix: "/users" });
  const users = createUserRepository(db);
  await app.register(organizerApplicationRoutes, {
    db,
    verifyIdToken,
    applicants: {
      findApplicant: users.findAccount,
      promoteToOrganizer: users.promoteToOrganizer,
    },
    ...organizerApplications,
    prefix: "/organizer-applications",
  });
  await app.register(tournamentRoutes, {
    db,
    verifyIdToken,
    accounts: { findAccount: users.findAccount },
    teams: createTeamLookup(db),
    findRole: users.findRoleByFirebaseUid,
    prefix: "/tournaments",
  });
  // Teams live in their own module, under the same /tournaments addresses.
  await app.register(teamRoutes, {
    db,
    verifyIdToken,
    accounts: { findAccount: users.findAccount },
    tournaments: createSignUpLookup(db),
    prefix: "/tournaments",
  });
  return app;
};
