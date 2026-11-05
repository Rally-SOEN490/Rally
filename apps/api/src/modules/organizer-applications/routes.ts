// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { FastifyPluginAsync } from "fastify";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import { createEmailOutbox } from "../email/outbox.ts";
import { createOrganizerApplicationRepository } from "./repository.ts";
import { reviewTokenPattern } from "./review-link.ts";
import { createOrganizerApplicationService, type Applicants } from "./service.ts";

// Text with at least one visible character. Line breaks are allowed, other
// invisible control characters aren't (PostgreSQL can't store some of them).
const multilineText = (maxLength: number) =>
  ({
    type: "string",
    maxLength,
    pattern: "^(?:\\P{Cc}|\\n|\\r)*[^\\s\\p{Cc}](?:\\P{Cc}|\\n|\\r)*$",
  }) as const;

const tokenSchema = { type: "string", pattern: reviewTokenPattern } as const;

const applySchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["description"],
    properties: {
      description: multilineText(1000),
      link: {
        anyOf: [
          { type: "null" },
          { type: "string", maxLength: 2048, pattern: "^https?://[^\\s]+$" },
        ],
      },
    },
  },
} as const;

const reviewSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["token"],
    properties: { token: tokenSchema },
  },
} as const;

const decisionSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["token", "decision"],
    properties: {
      token: tokenSchema,
      decision: { enum: ["approve", "deny"] },
      // Optional: blank counts as no reason.
      reason: {
        anyOf: [
          { type: "null" },
          { type: "string", maxLength: 500, pattern: "^(?:\\P{Cc}|\\n|\\r)*$" },
        ],
      },
    },
  },
} as const;

type ApplyBody = { description: string; link?: string | null };
type ReviewBody = { token: string };
type DecisionBody = ReviewBody & { decision: "approve" | "deny"; reason?: string | null };

export const organizerApplicationRoutes: FastifyPluginAsync<{
  db: Database;
  verifyIdToken: VerifyIdToken;
  applicants: Applicants;
  reviewerEmails: string[];
  appUrl: string;
  onEmailsQueued?: () => void;
}> = async (app, { db, verifyIdToken, applicants, reviewerEmails, appUrl, onEmailsQueued }) => {
  const applications = createOrganizerApplicationService({
    applications: createOrganizerApplicationRepository(db),
    applicants,
    enqueueEmails: createEmailOutbox(db).enqueue,
    reviewerEmails,
    appUrl,
    onEmailsQueued,
  });
  const loggedIn = requireUser(verifyIdToken);

  // A player applies to become an organizer. Reviewers are emailed a review link.
  app.post<{ Body: ApplyBody }>(
    "/",
    { preHandler: loggedIn, schema: applySchema },
    async (request, reply) =>
      reply.code(201).send(await applications.apply(request.firebaseUid, request.body)),
  );

  // The logged-in person's latest application, so the app can show its status.
  app.get("/me", { preHandler: loggedIn }, async (request) => ({
    application: await applications.getLatest(request.firebaseUid),
  }));

  // The review link's page. Reviewers don't log in: the token in the link is the
  // permission, and it travels in the body, never in a URL that could be logged.
  app.post<{ Body: ReviewBody }>("/review", { schema: reviewSchema }, (request) =>
    applications.getForReview(request.body.token),
  );

  app.post<{ Body: DecisionBody }>("/review/decision", { schema: decisionSchema }, (request) =>
    applications.decide(request.body.token, request.body.decision, request.body.reason),
  );
};
