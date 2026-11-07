// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

type Transaction = Prisma.TransactionClient;

export type NewOrganizerApplication = {
  userId: string;
  description: string;
  link: string | null;
  reviewTokenHash: string;
  expiresAt: Date;
};

// The only place that reads and writes the organizer_applications table.
// Functions that take a transaction run inside the caller's; the service decides
// what belongs together.
export const createOrganizerApplicationRepository = (db: Database) => ({
  // Runs `work` in one transaction. Inside it, run one query at a time.
  inTransaction: <T>(work: (transaction: Transaction) => Promise<T>) => db.$transaction(work),

  findLatestForUser: (userId: string) =>
    db.organizerApplication.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),

  findByTokenHash: (reviewTokenHash: string) =>
    db.organizerApplication.findUnique({
      where: { reviewTokenHash },
      include: { user: { select: { displayName: true } } },
    }),

  // Marks pending applications whose link ran out as expired, which frees the
  // person to apply again.
  expireDue: (
    match: { userId: string } | { id: string },
    now: Date,
    transaction: Transaction = db,
  ) =>
    transaction.organizerApplication.updateMany({
      where: { ...match, status: "PENDING", expiresAt: { lte: now } },
      data: { status: "EXPIRED", pendingUserId: null },
    }),

  // Fails with a unique-constraint error (P2002) if the person already has a
  // pending application.
  create: (application: NewOrganizerApplication, transaction: Transaction = db) =>
    transaction.organizerApplication.create({
      data: { ...application, pendingUserId: application.userId },
    }),

  // Records the decision only if the application is still pending and its link
  // hasn't expired. Returns how many rows changed: 0 means someone decided first
  // (PostgreSQL makes the second of two simultaneous decisions wait, then see that).
  decide: (
    id: string,
    decision: { status: "APPROVED" | "DENIED"; denyReason: string | null; now: Date },
    transaction: Transaction = db,
  ) =>
    transaction.organizerApplication.updateMany({
      where: { id, status: "PENDING", expiresAt: { gt: decision.now } },
      data: {
        status: decision.status,
        denyReason: decision.denyReason,
        decidedAt: decision.now,
        pendingUserId: null,
      },
    }),
});

export type OrganizerApplicationRepository = ReturnType<
  typeof createOrganizerApplicationRepository
>;
