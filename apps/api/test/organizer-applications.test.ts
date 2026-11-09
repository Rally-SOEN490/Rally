// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { buildApp } from "../src/app.ts";
import { hashReviewToken } from "../src/modules/organizer-applications/review-link.ts";
import { authHeader, testDb } from "./helpers.ts";
import { fakeVerifyIdToken, reviewTokenFrom, sampleApplication } from "./organizer-helpers.ts";

const reviewerEmails = ["first.reviewer@rally.test", "second.reviewer@rally.test"];
const onEmailsQueued = vi.fn();
const app = await buildApp({
  db: testDb,
  verifyIdToken: fakeVerifyIdToken,
  corsOrigins: [],
  organizerApplications: { reviewerEmails, appUrl: "https://rally.test", onEmailsQueued },
});

beforeEach(async () => {
  onEmailsQueued.mockClear();
  await testDb.emailOutbox.deleteMany();
  await testDb.user.deleteMany();
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const register = (uid: string, displayName = "Alice Tremblay") =>
  app.inject({
    method: "POST",
    url: "/users/me",
    headers: authHeader(uid),
    payload: { displayName, ageConfirmed: true },
  });
const apply = (uid: string, payload: object = sampleApplication) =>
  app.inject({ method: "POST", url: "/organizer-applications", headers: authHeader(uid), payload });
const latest = (uid: string) =>
  app.inject({ method: "GET", url: "/organizer-applications/me", headers: authHeader(uid) });
const storedApplications = () => testDb.organizerApplication.findMany();

// ---------- POST /organizer-applications ----------
test("saves a pending application and emails each reviewer the review link", async () => {
  await register("alice");

  const response = await apply("alice");

  expect(response.statusCode).toBe(201);
  const application = response.json();
  expect(application).toMatchObject({
    status: "PENDING",
    description: sampleApplication.description,
    link: sampleApplication.link,
    denyReason: null,
    decidedAt: null,
  });
  const lifetime = Date.parse(application.expiresAt) - Date.parse(application.createdAt);
  expect(lifetime).toBeGreaterThan(14 * 24 * 3600_000 - 60_000);
  expect(lifetime).toBeLessThan(14 * 24 * 3600_000 + 60_000);

  const emails = await testDb.emailOutbox.findMany({ orderBy: { recipient: "asc" } });
  expect(emails.map((email) => email.recipient)).toEqual(reviewerEmails);
  expect(emails[0].subject).toBe("Rally: Alice Tremblay wants to become an organizer");
  expect(emails[0].body).toContain(sampleApplication.description);
  expect(emails[0].body).toContain(sampleApplication.link);
  expect(emails[0].body).toContain("https://rally.test/organizer-review#token=");
  expect(emails[1].body).toBe(emails[0].body);
  expect(onEmailsQueued).toHaveBeenCalledOnce();
});

test("stores only a hash of the review token", async () => {
  await register("alice");
  await apply("alice");

  const token = await reviewTokenFrom(testDb);
  const [stored] = await storedApplications();
  expect(stored.reviewTokenHash).toBe(hashReviewToken(token));
  expect(JSON.stringify(stored)).not.toContain(token);
});

test("trims the description and accepts an application without a link", async () => {
  await register("alice");

  const response = await apply("alice", { description: "  Beach 2s every Sunday \n" });

  expect(response.statusCode).toBe(201);
  expect(response.json()).toMatchObject({ description: "Beach 2s every Sunday", link: null });
});

test.each([
  ["the description is missing", { link: null }],
  ["the description is blank", { description: "  \n " }],
  ["the description is too long", { description: "a".repeat(1001) }],
  ["the description has a control character", { description: "a\u0000b" }],
  ["the link isn't a web address", { description: "6v6", link: "instagram.com/me" }],
  ["the link has a space", { description: "6v6", link: "https://example.com/a b" }],
  ["the link is too long", { description: "6v6", link: `https://a.ca/${"a".repeat(2040)}` }],
])("rejects the application when %s", async (_, payload) => {
  await register("alice");

  const response = await apply("alice", payload);

  expect(response.statusCode).toBe(400);
  expect(await storedApplications()).toEqual([]);
  expect(await testDb.emailOutbox.count()).toBe(0);
});

// Fastify drops fields the schema doesn't list, so an applicant can't approve themselves.
test("ignores a status sent with the application", async () => {
  await register("alice");

  const response = await apply("alice", { ...sampleApplication, status: "APPROVED" });

  expect(response.json().status).toBe("PENDING");
  expect(await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } })).toMatchObject({
    role: "PLAYER",
  });
});

test("asks to log in before applying", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/organizer-applications",
    payload: sampleApplication,
  });

  expect(response.statusCode).toBe(401);
});

test("needs a Rally account", async () => {
  const response = await apply("nobody");

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ message: "No Rally account found." });
});

test.each(["ORGANIZER", "ADMIN"] as const)("turns away an %s", async (role) => {
  await register("alice");
  await testDb.user.update({ where: { firebaseUid: "alice" }, data: { role } });

  const response = await apply("alice");

  expect(response.statusCode).toBe(409);
  expect(response.json()).toEqual({ message: "You're already an organizer." });
  expect(await storedApplications()).toEqual([]);
});

test("allows one pending application at a time, without emailing again", async () => {
  await register("alice");
  await apply("alice");

  const second = await apply("alice", { description: "Something else" });

  expect(second.statusCode).toBe(409);
  expect(second.json()).toEqual({
    message: "You already have an application waiting for review.",
  });
  expect(await storedApplications()).toHaveLength(1);
  expect(await testDb.emailOutbox.count()).toBe(reviewerEmails.length);
});

test("keeps one application when the same request arrives several times at once", async () => {
  await register("alice");

  const responses = await Promise.all(Array.from({ length: 5 }, () => apply("alice")));

  const codes = responses.map((response) => response.statusCode).sort();
  expect(codes).toEqual([201, 409, 409, 409, 409]);
  expect(await storedApplications()).toHaveLength(1);
  expect(await testDb.emailOutbox.count()).toBe(reviewerEmails.length);
});

test("lets a denied player apply again", async () => {
  await register("alice");
  await apply("alice");
  await testDb.organizerApplication.updateMany({
    data: { status: "DENIED", pendingUserId: null, decidedAt: new Date() },
  });

  const again = await apply("alice", { description: "Now with a league" });

  expect(again.statusCode).toBe(201);
  expect(await storedApplications()).toHaveLength(2);
});

test("lets a player apply again once the review link expired", async () => {
  await register("alice");
  const first = (await apply("alice")).json();
  await testDb.organizerApplication.updateMany({ data: { expiresAt: new Date(Date.now() - 1) } });

  const again = await apply("alice");

  expect(again.statusCode).toBe(201);
  const old = await testDb.organizerApplication.findUniqueOrThrow({ where: { id: first.id } });
  expect(old).toMatchObject({ status: "EXPIRED", pendingUserId: null });
});

test("saves the application without emails when no reviewers are set", async () => {
  const quietApp = await buildApp({
    db: testDb,
    verifyIdToken: fakeVerifyIdToken,
    corsOrigins: [],
    organizerApplications: { reviewerEmails: [], appUrl: "https://rally.test", onEmailsQueued },
  });
  await register("alice");

  const response = await quietApp.inject({
    method: "POST",
    url: "/organizer-applications",
    headers: authHeader("alice"),
    payload: sampleApplication,
  });

  expect(response.statusCode).toBe(201);
  expect(await testDb.emailOutbox.count()).toBe(0);
  expect(onEmailsQueued).not.toHaveBeenCalled();
  await quietApp.close();
});

// ---------- GET /organizer-applications/me ----------
test("returns null before the player applies", async () => {
  await register("alice");

  const response = await latest("alice");

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ application: null });
});

test("returns the player's latest application, not someone else's", async () => {
  await register("alice");
  await register("bob", "Bob");
  await apply("alice");
  await testDb.organizerApplication.updateMany({
    data: { status: "DENIED", pendingUserId: null, denyReason: "Add a link" },
  });
  const newest = (await apply("alice", { description: "Second try" })).json();
  await apply("bob", { description: "Bob's events" });

  const response = await latest("alice");

  expect(response.json()).toEqual({ application: newest });
});

test("shows a pending application as expired once its link ran out", async () => {
  await register("alice");
  await apply("alice");
  await testDb.organizerApplication.updateMany({ data: { expiresAt: new Date(Date.now() - 1) } });

  const response = await latest("alice");

  expect(response.json().application.status).toBe("EXPIRED");
  expect((await storedApplications())[0].status).toBe("EXPIRED");
});

test("asks to log in before showing an application", async () => {
  const response = await app.inject({ method: "GET", url: "/organizer-applications/me" });

  expect(response.statusCode).toBe(401);
});
