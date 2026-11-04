// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { EmailOutbox, QueuedEmail } from "./outbox.ts";

// Sends one email. Throws if it wasn't accepted, so the sender tries again later.
export type EmailTransport = (email: QueuedEmail) => Promise<void>;

// Sends through Resend's HTTP API. The outbox ID is the idempotency key, so if a
// retry repeats an email Resend already accepted, Resend doesn't send it twice.
export const resendTransport =
  (apiKey: string, from: string, fetchImpl: typeof fetch = fetch): EmailTransport =>
  async (email) => {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.id,
      },
      body: JSON.stringify({
        from,
        to: [email.recipient],
        subject: email.subject,
        text: email.body,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    // Only the status: the response never contains the key, but keep logs plain.
    if (!response.ok) throw new Error(`Resend answered ${response.status}`);
  };

// For local development without a Resend key: prints the email instead. Never
// use it in production, because the email can contain a review link.
export const logTransport =
  (print: (text: string) => void): EmailTransport =>
  async (email) =>
    print(
      [
        "─── Email not sent (RESEND_API_KEY is not set) ───",
        `To: ${email.recipient}`,
        `Subject: ${email.subject}`,
        "",
        email.body,
        "──────────────────────────────────────────────────",
      ].join("\n"),
    );

const batchSize = 10;
export const maxAttempts = 8;

// 1, 2, 4… minutes after each failed attempt, at most an hour.
export const retryDelayMs = (attempts: number) => Math.min(2 ** (attempts - 1), 60) * 60_000;

type SenderOptions = {
  outbox: EmailOutbox;
  transport: EmailTransport;
  now?: () => Date;
  // Told about each failed attempt. Gets the outbox ID, never the email itself.
  onError?: (id: string, error: unknown) => void;
};

// Sends one batch of due emails. Returns how many it claimed.
const deliverBatch = async ({
  outbox,
  transport,
  now = () => new Date(),
  onError = () => {},
}: SenderOptions) => {
  const emails = await outbox.claimDue(now(), batchSize);
  for (const email of emails) {
    try {
      await transport(email);
      await outbox.markSent(email.id, now());
    } catch (error) {
      onError(email.id, error);
      const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
      if (email.attempts >= maxAttempts) await outbox.markFailed(email.id, now(), message);
      else {
        const nextAttemptAt = new Date(now().getTime() + retryDelayMs(email.attempts));
        await outbox.markRetry(email.id, nextAttemptAt, message);
      }
    }
  }
  return emails.length;
};

export const createEmailSender = (options: SenderOptions) => {
  let running: Promise<void> | null = null;
  let callsWhileRunning = false;

  return {
    // Sends every email that is due. Safe to call often and from several places:
    // a call made while a run is going on doesn't start a second one; the run
    // goes round once more instead, so it also sends what was queued meanwhile.
    deliverDue: () => {
      if (running) {
        callsWhileRunning = true;
        return running;
      }
      running = (async () => {
        try {
          do {
            callsWhileRunning = false;
            while ((await deliverBatch(options)) === batchSize);
          } while (callsWhileRunning);
        } finally {
          running = null;
        }
      })();
      return running;
    },
  };
};

export type EmailSender = ReturnType<typeof createEmailSender>;
