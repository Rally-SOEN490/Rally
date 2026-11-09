// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

export type NewEmail = { recipient: string; subject: string; body: string };
export type QueuedEmail = NewEmail & { id: string; attempts: number };

// How long a sender may work on a claimed email before another sender may try it.
const claimSeconds = 120;

// The only place that reads and writes the email_outbox table.
export const createEmailOutbox = (db: Database) => ({
  // Pass the transaction of the change that needs the emails, so both are saved
  // together or not at all.
  enqueue: async (emails: NewEmail[], transaction: Prisma.TransactionClient = db) => {
    if (emails.length > 0) await transaction.emailOutbox.createMany({ data: emails });
  },

  // Claims up to `limit` emails that are due, oldest first, and counts the attempt.
  // SKIP LOCKED lets several senders run at once without claiming the same email.
  claimDue: (now: Date, limit: number) =>
    db.$queryRaw<QueuedEmail[]>`
      UPDATE email_outbox
      SET locked_until = ${new Date(now.getTime() + claimSeconds * 1000)},
          attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM email_outbox
        WHERE sent_at IS NULL AND failed_at IS NULL AND next_attempt_at <= ${now}
          AND (locked_until IS NULL OR locked_until < ${now})
        ORDER BY created_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, recipient, subject, body, attempts`,

  markSent: (id: string, now: Date) =>
    db.emailOutbox.update({
      where: { id },
      data: { sentAt: now, body: null, lockedUntil: null, lastError: null },
    }),

  markRetry: (id: string, nextAttemptAt: Date, error: string) =>
    db.emailOutbox.update({
      where: { id },
      data: { nextAttemptAt, lockedUntil: null, lastError: error },
    }),

  markFailed: (id: string, now: Date, error: string) =>
    db.emailOutbox.update({
      where: { id },
      data: { failedAt: now, body: null, lockedUntil: null, lastError: error },
    }),
});

export type EmailOutbox = ReturnType<typeof createEmailOutbox>;
