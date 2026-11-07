// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { createEmailOutbox, type QueuedEmail } from "../src/modules/email/outbox.ts";
import {
  createEmailSender,
  logTransport,
  maxAttempts,
  resendTransport,
  retryDelayMs,
  type EmailTransport,
} from "../src/modules/email/sender.ts";
import { testDb } from "./helpers.ts";

const outbox = createEmailOutbox(testDb);
const email = (n: number) => ({
  recipient: `reviewer${n}@rally.test`,
  subject: `Subject ${n}`,
  body: `Body ${n}`,
});

// A clock the test moves by hand.
let time: Date;
const now = () => time;
const later = (ms: number) => {
  time = new Date(time.getTime() + ms);
};

beforeEach(async () => {
  time = new Date("2026-11-04T12:00:00Z");
  await testDb.emailOutbox.deleteMany();
});
afterAll(() => testDb.$disconnect());

const enqueueAt = async (count: number) => {
  await outbox.enqueue(Array.from({ length: count }, (_, n) => email(n)));
  // Due from the test clock's start.
  await testDb.emailOutbox.updateMany({ data: { nextAttemptAt: time } });
};

// ---------- the email sender ----------
test("sends a queued email once, then clears its body", async () => {
  await enqueueAt(1);
  const transport = vi.fn<EmailTransport>().mockResolvedValue();
  const sender = createEmailSender({ outbox, transport, now });

  await sender.deliverDue();
  await sender.deliverDue();

  expect(transport).toHaveBeenCalledOnce();
  expect(transport.mock.calls[0][0]).toMatchObject({ ...email(0), attempts: 1 });
  expect(await testDb.emailOutbox.findFirstOrThrow()).toMatchObject({
    sentAt: time,
    body: null,
    lockedUntil: null,
  });
});

test("tries a failed email again after a delay, keeping it until it is sent", async () => {
  await enqueueAt(1);
  const transport = vi
    .fn<EmailTransport>()
    .mockRejectedValueOnce(new Error("Resend answered 503"))
    .mockResolvedValue();
  const onError = vi.fn();
  const sender = createEmailSender({ outbox, transport, now, onError });

  await sender.deliverDue();
  expect(await testDb.emailOutbox.findFirstOrThrow()).toMatchObject({
    sentAt: null,
    body: "Body 0",
    attempts: 1,
    lastError: "Resend answered 503",
    nextAttemptAt: new Date(time.getTime() + 60_000),
  });
  expect(onError).toHaveBeenCalledWith(expect.any(String), expect.any(Error));

  await sender.deliverDue();
  expect(transport).toHaveBeenCalledOnce();

  later(60_000);
  await sender.deliverDue();
  expect(transport).toHaveBeenCalledTimes(2);
  expect(await testDb.emailOutbox.findFirstOrThrow()).toMatchObject({ sentAt: time, body: null });
});

test(`gives up after ${maxAttempts} attempts`, async () => {
  await enqueueAt(1);
  const transport = vi.fn<EmailTransport>().mockRejectedValue(new Error("Resend answered 422"));
  const sender = createEmailSender({ outbox, transport, now });

  for (let attempt = 1; attempt <= maxAttempts + 2; attempt++) {
    await sender.deliverDue();
    later(retryDelayMs(attempt));
  }

  expect(transport).toHaveBeenCalledTimes(maxAttempts);
  expect(await testDb.emailOutbox.findFirstOrThrow()).toMatchObject({
    sentAt: null,
    failedAt: expect.any(Date),
    body: null,
    attempts: maxAttempts,
  });
});

test("sends each email once when two senders run at the same time", async () => {
  await enqueueAt(25);
  const sent: string[] = [];
  const transport: EmailTransport = async ({ id }) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    sent.push(id);
  };

  await Promise.all([
    createEmailSender({ outbox, transport, now }).deliverDue(),
    createEmailSender({ outbox, transport, now }).deliverDue(),
  ]);

  expect(sent).toHaveLength(25);
  expect(new Set(sent).size).toBe(25);
});

test("also sends what was queued while it was running", async () => {
  await enqueueAt(1);
  let releaseFirst!: () => void;
  const transport = vi
    .fn<EmailTransport>()
    .mockImplementationOnce(() => new Promise((resolve) => (releaseFirst = resolve)))
    .mockResolvedValue();
  const sender = createEmailSender({ outbox, transport, now });

  const firstRun = sender.deliverDue();
  await vi.waitFor(() => expect(transport).toHaveBeenCalledOnce());
  await outbox.enqueue([email(1)]);
  await testDb.emailOutbox.updateMany({ where: { sentAt: null }, data: { nextAttemptAt: time } });
  const secondCall = sender.deliverDue();
  releaseFirst();
  await Promise.all([firstRun, secondCall]);

  expect(transport).toHaveBeenCalledTimes(2);
  expect(await testDb.emailOutbox.count({ where: { sentAt: null } })).toBe(0);
});

test("never sees emails from a transaction that was rolled back", async () => {
  await testDb
    .$transaction(async (transaction) => {
      await outbox.enqueue([email(0)], transaction);
      throw new Error("The change that needed the email failed");
    })
    .catch(() => undefined);

  expect(await testDb.emailOutbox.count()).toBe(0);
});

test("waits 1, 2, 4… minutes between attempts, at most an hour", () => {
  expect([1, 2, 3, 4, 7, 8].map((attempts) => retryDelayMs(attempts) / 60_000)).toEqual([
    1, 2, 4, 8, 60, 60,
  ]);
});

const queued: QueuedEmail = { id: "outbox-id", attempts: 1, ...email(0) };

// ---------- resendTransport ----------
test("sends through Resend with the outbox ID as the idempotency key", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }));

  await resendTransport("re_test_key", "Rally <noreply@rally.test>", fetchImpl)(queued);

  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(init?.headers).toMatchObject({
    Authorization: "Bearer re_test_key",
    "Idempotency-Key": "outbox-id",
  });
  expect(JSON.parse(init?.body as string)).toEqual({
    from: "Rally <noreply@rally.test>",
    to: ["reviewer0@rally.test"],
    subject: "Subject 0",
    text: "Body 0",
  });
});

test("throws when Resend refuses the email, without the key in the message", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 422 }));

  await expect(resendTransport("re_test_key", "Rally <a@b.c>", fetchImpl)(queued)).rejects.toThrow(
    /^Resend answered 422$/,
  );
});

test("logTransport prints the email instead of sending it", async () => {
  const print = vi.fn();

  await logTransport(print)(queued);

  expect(print.mock.calls[0][0]).toContain("To: reviewer0@rally.test");
  expect(print.mock.calls[0][0]).toContain("Subject: Subject 0");
  expect(print.mock.calls[0][0]).toContain("Body 0");
});
