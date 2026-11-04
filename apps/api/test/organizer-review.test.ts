// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test } from "vitest";
import { buildApp } from "../src/app.ts";
import { authHeader, testDb } from "./helpers.ts";
import { fakeVerifyIdToken, reviewTokenFrom, sampleApplication } from "./organizer-helpers.ts";

const app = await buildApp({
  db: testDb,
  verifyIdToken: fakeVerifyIdToken,
  corsOrigins: [],
  organizerApplications: { reviewerEmails: ["reviewer@rally.test"], appUrl: "https://rally.test" },
});

// Alice signs up and applies; `token` is the one in the reviewer's email.
let token: string;
beforeEach(async () => {
  await testDb.emailOutbox.deleteMany();
  await testDb.user.deleteMany();
  await app.inject({
    method: "POST",
    url: "/users/me",
    headers: authHeader("alice"),
    payload: { displayName: "Alice Tremblay", ageConfirmed: true },
  });
  await app.inject({
    method: "POST",
    url: "/organizer-applications",
    headers: authHeader("alice"),
    payload: sampleApplication,
  });
  token = await reviewTokenFrom(testDb);
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

// Reviewers don't log in, so these send no Authorization header.
const lookUp = (reviewToken = token) =>
  app.inject({
    method: "POST",
    url: "/organizer-applications/review",
    payload: { token: reviewToken },
  });
const decide = (payload: object) =>
  app.inject({
    method: "POST",
    url: "/organizer-applications/review/decision",
    payload: { token, ...payload },
  });
const aliceRole = async () =>
  (await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } })).role;
const aliceSees = async () =>
  (
    await app.inject({
      method: "GET",
      url: "/organizer-applications/me",
      headers: authHeader("alice"),
    })
  ).json().application;
const expireTheLink = () =>
  testDb.organizerApplication.updateMany({ data: { expiresAt: new Date(Date.now() - 1) } });

// ---------- POST /organizer-applications/review ----------
test("shows the application and only the applicant's name", async () => {
  const response = await lookUp();

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    applicantName: "Alice Tremblay",
    status: "PENDING",
    ...sampleApplication,
  });
  expect(Object.keys(response.json()).sort()).toEqual([
    "applicantName",
    "createdAt",
    "decidedAt",
    "denyReason",
    "description",
    "expiresAt",
    "link",
    "status",
  ]);
});

test("rejects a link that doesn't belong to any application", async () => {
  const response = await lookUp("A".repeat(43));

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ message: "This review link isn't valid." });
});

test.each([
  ["too short", "abc"],
  ["not URL-safe", `${"A".repeat(42)}+`],
])("rejects a token that is %s", async (_, badToken) => {
  expect((await lookUp(badToken)).statusCode).toBe(400);
});

test("shows an application whose link ran out as expired", async () => {
  await expireTheLink();

  expect((await lookUp()).json().status).toBe("EXPIRED");
});

// ---------- POST /organizer-applications/review/decision ----------
test("approving makes the player an organizer", async () => {
  const response = await decide({ decision: "approve" });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ status: "APPROVED", denyReason: null });
  expect(response.json().decidedAt).toEqual(expect.any(String));
  expect(await aliceRole()).toBe("ORGANIZER");
  expect(await aliceSees()).toMatchObject({ status: "APPROVED" });
});

test("denying keeps the player a player and shows them the reason", async () => {
  const response = await decide({ decision: "deny", reason: "  Add a link to past events. " });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    status: "DENIED",
    denyReason: "Add a link to past events.",
  });
  expect(await aliceRole()).toBe("PLAYER");
  expect(await aliceSees()).toMatchObject({
    status: "DENIED",
    denyReason: "Add a link to past events.",
  });
});

test.each([
  ["no reason", {}],
  ["a null reason", { reason: null }],
  ["a blank reason", { reason: "   " }],
])("accepts a denial with %s", async (_, extra) => {
  const response = await decide({ decision: "deny", ...extra });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ status: "DENIED", denyReason: null });
});

test("ignores a reason sent with an approval", async () => {
  const response = await decide({ decision: "approve", reason: "Welcome!" });

  expect(response.json()).toMatchObject({ status: "APPROVED", denyReason: null });
});

test("keeps the first decision", async () => {
  await decide({ decision: "approve" });

  const second = await decide({ decision: "deny", reason: "Changed my mind" });

  expect(second.statusCode).toBe(409);
  expect(second.json()).toEqual({ message: "This request was already approved." });
  expect(await aliceRole()).toBe("ORGANIZER");
  expect((await lookUp()).json()).toMatchObject({ status: "APPROVED", denyReason: null });
});

test("says a denied request was already denied", async () => {
  await decide({ decision: "deny" });

  const second = await decide({ decision: "approve" });

  expect(second.json()).toEqual({ message: "This request was already denied." });
  expect(await aliceRole()).toBe("PLAYER");
});

test("lets only one of two simultaneous decisions through", async () => {
  const responses = await Promise.all([
    decide({ decision: "approve" }),
    decide({ decision: "deny" }),
  ]);

  expect(responses.map((response) => response.statusCode).sort()).toEqual([200, 409]);
  const { status } = (await lookUp()).json();
  expect(await aliceRole()).toBe(status === "APPROVED" ? "ORGANIZER" : "PLAYER");
});

test("refuses to decide once the link expired", async () => {
  await expireTheLink();

  const response = await decide({ decision: "approve" });

  expect(response.statusCode).toBe(410);
  expect(response.json()).toEqual({
    message: "This review link has expired. The person can apply again.",
  });
  expect(await aliceRole()).toBe("PLAYER");
  expect(await aliceSees()).toMatchObject({ status: "EXPIRED" });
});

test("never lowers an admin's role", async () => {
  await testDb.user.update({ where: { firebaseUid: "alice" }, data: { role: "ADMIN" } });

  await decide({ decision: "approve" });

  expect(await aliceRole()).toBe("ADMIN");
});

test.each([
  ["an unknown decision", { decision: "maybe" }],
  ["no decision", {}],
  ["a reason that is too long", { decision: "deny", reason: "a".repeat(501) }],
])("rejects %s", async (_, payload) => {
  const response = await decide(payload);

  expect(response.statusCode).toBe(400);
  expect((await lookUp()).json().status).toBe("PENDING");
});

test("refuses a decision through a link that belongs to no application", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/organizer-applications/review/decision",
    payload: { token: "B".repeat(43), decision: "approve" },
  });

  expect(response.statusCode).toBe(404);
  expect(await aliceRole()).toBe("PLAYER");
});
