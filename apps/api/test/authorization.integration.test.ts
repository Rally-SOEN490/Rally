// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();

beforeEach(async () => {
  await testDb.tournament.deleteMany();
  await testDb.user.deleteMany();
});

afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const createAccount = (firebaseUid: string, role: "PLAYER" | "ORGANIZER" | "ADMIN") =>
  testDb.user.create({
    data: {
      firebaseUid,
      displayName: firebaseUid,
      ageConfirmedAt: new Date(),
      role,
    },
  });

describe("tournament authorization integration", () => {
  test("denies a player before creating a tournament", async () => {
    await createAccount("player", "PLAYER");

    const response = await app.inject({
      method: "POST",
      url: "/tournaments",
      headers: authHeader("player"),
      payload: { name: "Player Cup" },
    });

    expect(response.statusCode).toBe(403);
    expect(await testDb.tournament.count()).toBe(0);
  });

  test("allows an organizer to create a tournament but hides it from another organizer", async () => {
    await createAccount("organizer", "ORGANIZER");
    await createAccount("rival", "ORGANIZER");

    const created = await app.inject({
      method: "POST",
      url: "/tournaments",
      headers: authHeader("organizer"),
      payload: { name: "Organizer Cup" },
    });
    const tournamentId = created.json().id;

    const rivalRead = await app.inject({
      method: "GET",
      url: `/tournaments/${tournamentId}`,
      headers: authHeader("rival"),
    });
    const rivalUpdate = await app.inject({
      method: "PATCH",
      url: `/tournaments/${tournamentId}`,
      headers: authHeader("rival"),
      payload: { name: "Rival Cup" },
    });

    expect(created.statusCode).toBe(201);
    expect(rivalRead.statusCode).toBe(404);
    expect(rivalUpdate.statusCode).toBe(404);
    expect((await testDb.tournament.findUniqueOrThrow({ where: { id: tournamentId } })).name).toBe(
      "Organizer Cup",
    );
  });
});
