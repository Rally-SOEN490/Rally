// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { buildApp } from "../src/app.ts";
import { authHeader, testDb } from "./helpers.ts";
import { fakeVerifyIdToken, reviewTokenFrom, sampleApplication } from "./organizer-helpers.ts";
import { completeSetup, sampleDivision } from "./tournament-helpers.ts";

const app = await buildApp({
  db: testDb,
  verifyIdToken: fakeVerifyIdToken,
  corsOrigins: [],
  organizerApplications: {
    reviewerEmails: ["reviewer@rally.test"],
    appUrl: "https://rally.test",
  },
});
const baseUrl = await app.listen({ host: "127.0.0.1", port: 0 });

beforeEach(async () => {
  await testDb.tournament.deleteMany();
  await testDb.organizerApplication.deleteMany();
  await testDb.emailOutbox.deleteMany();
  await testDb.user.deleteMany();
});

afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const request = async (
  method: "GET" | "POST" | "PATCH",
  path: string,
  uid?: string,
  body?: object,
) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(uid ? authHeader(uid) : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
};

const register = (uid: string, displayName = uid) =>
  request("POST", "/users/me", uid, { displayName, ageConfirmed: true });

describe("first-release HTTP integration", () => {
  test("persists a profile update across client-shaped HTTP requests", async () => {
    await register("alice", "Alice");

    const update = await request("PATCH", "/users/me", "alice", {
      lookingForTeam: true,
      thoughtText: "Ready to play.",
    });
    const profile = await request("GET", "/users/me", "alice");

    expect(update.status).toBe(200);
    expect(update.body).toMatchObject({
      displayName: "Alice",
      lookingForTeam: true,
      thoughtText: "Ready to play.",
    });
    expect(profile.body).toMatchObject({
      displayName: "Alice",
      lookingForTeam: true,
      thoughtText: "Ready to play.",
    });
  });

  test("rejects an invalid profile update without overwriting the saved profile", async () => {
    await register("alice", "Alice");

    const update = await request("PATCH", "/users/me", "alice", { displayName: "   " });
    const profile = await request("GET", "/users/me", "alice");

    expect(update.status).toBe(400);
    expect(profile.body).toMatchObject({ displayName: "Alice" });
  });

  test("publishes a tournament that the player browse request can read", async () => {
    await register("organizer", "Organizer");
    await testDb.user.update({
      where: { firebaseUid: "organizer" },
      data: { role: "ORGANIZER" },
    });
    await register("player", "Player");

    const created = await request("POST", "/tournaments", "organizer", {
      name: "Verdun Winter Cup",
      ...completeSetup,
    });
    const division = await request(
      "POST",
      `/tournaments/${created.body.id}/divisions`,
      "organizer",
      sampleDivision,
    );
    const published = await request("POST", `/tournaments/${created.body.id}/publish`, "organizer");
    const browse = await request("GET", "/tournaments", "player");

    expect(created.status).toBe(201);
    expect(division.status).toBe(201);
    expect(published.status).toBe(200);
    expect(browse.status).toBe(200);
    expect(browse.body).toEqual([
      expect.objectContaining({
        id: created.body.id,
        name: "Verdun Winter Cup",
        divisions: [expect.objectContaining({ name: sampleDivision.name })],
      }),
    ]);
  });

  test("denies a player from creating an organizer tournament", async () => {
    await register("player", "Player");

    const response = await request("POST", "/tournaments", "player", {
      name: "Player Cup",
    });

    expect(response.status).toBe(403);
    expect(await testDb.tournament.count()).toBe(0);
  });

  test("approves an organizer application and exposes the new role to the applicant", async () => {
    await register("alice", "Alice Tremblay");

    const applied = await request("POST", "/organizer-applications", "alice", sampleApplication);
    const token = await reviewTokenFrom(testDb);
    const review = await request("POST", "/organizer-applications/review", undefined, { token });
    const decision = await request("POST", "/organizer-applications/review/decision", undefined, {
      token,
      decision: "approve",
    });
    const latest = await request("GET", "/organizer-applications/me", "alice");

    expect(applied.status).toBe(201);
    expect(review.body).toMatchObject({
      applicantName: "Alice Tremblay",
      status: "PENDING",
      description: sampleApplication.description,
    });
    expect(decision.body).toMatchObject({ status: "APPROVED" });
    expect(latest.body.application).toMatchObject({ status: "APPROVED" });
    expect((await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } })).role).toBe(
      "ORGANIZER",
    );
  });

  test("denies an organizer application and keeps the applicant a player", async () => {
    await register("alice", "Alice Tremblay");

    await request("POST", "/organizer-applications", "alice", sampleApplication);
    const token = await reviewTokenFrom(testDb);
    const decision = await request("POST", "/organizer-applications/review/decision", undefined, {
      token,
      decision: "deny",
      reason: "Add a link to past events.",
    });
    const latest = await request("GET", "/organizer-applications/me", "alice");

    expect(decision.status).toBe(200);
    expect(decision.body).toMatchObject({
      status: "DENIED",
      denyReason: "Add a link to past events.",
    });
    expect(latest.body.application).toMatchObject({
      status: "DENIED",
      denyReason: "Add a link to past events.",
    });
    expect((await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } })).role).toBe(
      "PLAYER",
    );
  });
});
