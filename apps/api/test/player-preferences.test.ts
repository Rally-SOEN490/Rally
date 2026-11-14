// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
const register = (uid: string, name = uid) =>
  app.inject({
    method: "POST",
    url: "/users/me",
    headers: authHeader(uid),
    payload: { displayName: name, ageConfirmed: true },
  });
const patch = (uid: string, payload: object) =>
  app.inject({ method: "PATCH", url: "/users/me", headers: authHeader(uid), payload });
const getMe = (uid: string) =>
  app.inject({ method: "GET", url: "/users/me", headers: authHeader(uid) });
beforeEach(() => testDb.user.deleteMany());
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

describe("Saved player preferences", () => {
  test("defaults to no declared level and empty interests", async () => {
    const response = await register("alice");
    expect(response.json()).toMatchObject({
      skillLevel: null,
      interests: { formats: [], positions: [], clubs: [], other: [] },
    });
  });

  test.each(["C", "C+", "B-", "B"])(
    "persists level %s and exposes it in the directory",
    async (skillLevel) => {
      await register("alice");
      await register("viewer");
      expect((await patch("alice", { skillLevel })).statusCode).toBe(200);
      expect((await getMe("alice")).json().skillLevel).toBe(skillLevel);
      const response = await app.inject({
        method: "GET",
        url: "/users",
        headers: authHeader("viewer"),
      });
      expect(
        response.json().find((player: { displayName: string }) => player.displayName === "alice")
          .skillLevel,
      ).toBe(skillLevel);
    },
  );

  test("clears a declared level and cannot change another player's preference", async () => {
    await register("alice");
    await register("bob");
    await patch("alice", { skillLevel: "B" });
    expect((await getMe("bob")).json().skillLevel).toBeNull();
    await patch("alice", { skillLevel: null });
    expect((await getMe("alice")).json().skillLevel).toBeNull();
  });

  test.each(["A", "B+", "c", "", 4, false, ["B"]])(
    "rejects an invalid level %j without changing it",
    async (skillLevel) => {
      await register("alice");
      const response = await patch("alice", { skillLevel });
      expect(response.statusCode).toBe(400);
      expect((await getMe("alice")).json().skillLevel).toBeNull();
    },
  );

  test("requires authentication to update preferences", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me",
      payload: { skillLevel: "B" },
    });
    expect(response.statusCode).toBe(401);
  });

  test("saves added formats alongside the existing managed interests", async () => {
    await register("alice");
    const interests = {
      formats: ["indoor-4s", "beach-4s", "grass-4s"],
      positions: ["power", "opposite"],
      clubs: ["ckvc"],
      other: ["co-ed"],
    };
    expect((await patch("alice", { interests })).statusCode).toBe(200);
    const saved = (await getMe("alice")).json().interests;
    expect(saved).toEqual({
      ...interests,
      formats: [...interests.formats].sort(),
      positions: [...interests.positions].sort(),
    });
    expect(await testDb.userInterest.count()).toBe(7);
  });

  test("does not reintroduce competition preferences", async () => {
    await register("alice");
    const response = await patch("alice", {
      interests: { formats: [], positions: [], competitionTypes: ["men"] },
    });
    // Match main's additional-property handling: no unsupported category is persisted or exposed.
    expect([200, 400]).toContain(response.statusCode);
    expect((await getMe("alice")).json().interests).not.toHaveProperty("competitionTypes");
    expect(await testDb.userInterest.count()).toBe(0);
  });

  test("returns real public preferences, excludes self, and keeps private fields out", async () => {
    await register("alice", "Alice");
    await register("viewer", "Viewer");
    await patch("alice", {
      skillLevel: "C+",
      interests: { formats: ["beach-4s"], positions: ["libero"], other: ["co-ed"] },
    });
    const response = await app.inject({
      method: "GET",
      url: "/users",
      headers: authHeader("viewer"),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    const [player] = response.json();
    expect(player).toMatchObject({
      displayName: "Alice",
      skillLevel: "C+",
      interests: { formats: ["beach-4s"], positions: ["libero"], other: ["co-ed"] },
    });
    expect(Object.keys(player).sort()).toEqual([
      "badges",
      "createdAt",
      "displayName",
      "id",
      "interests",
      "lookingForTeam",
      "skillLevel",
    ]);
  });
});
