// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
beforeEach(() => testDb.user.deleteMany());
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const register = (uid: string, body: object) =>
  app.inject({ method: "POST", url: "/users/me", headers: authHeader(uid), payload: body });

describe("POST /users/me", () => {
  test("saves the logged-in user", async () => {
    const response = await register("alice", { displayName: " Alice ", ageConfirmed: true });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ displayName: "Alice" });
    expect(response.json().badges[0]).toMatchObject({
      key: "champion",
      name: "Champion",
      icon: "🏆",
    });
    expect(response.json().badges).toHaveLength(4);
    const saved = await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } });
    expect(saved.displayName).toBe("Alice");
    expect(saved.ageConfirmedAt).toBeInstanceOf(Date);
    expect(await testDb.userBadge.count({ where: { userId: saved.id } })).toBe(4);
  });

  test("does not send back the Firebase ID", async () => {
    const response = await register("alice", { displayName: "Alice", ageConfirmed: true });

    expect(Object.keys(response.json()).sort()).toEqual(["badges", "createdAt", "displayName", "id"]);
  });

  test("is safe to retry and keeps the first record", async () => {
    const first = await register("alice", { displayName: "Alice", ageConfirmed: true });
    const second = await register("alice", { displayName: "Someone else", ageConfirmed: true });

    expect(second.json()).toEqual(first.json());
    expect(await testDb.user.count()).toBe(1);
  });

  test("is safe when the same sign-up arrives several times at once", async () => {
    // For example, a double tap on "Continue".
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => register("alice", { displayName: "Alice", ageConfirmed: true })),
    );

    expect(responses.map((response) => response.statusCode)).toEqual([200, 200, 200, 200, 200]);
    expect(new Set(responses.map((response) => response.json().id)).size).toBe(1);
    expect(await testDb.user.count()).toBe(1);
  });

  test("accepts accents and emoji in names", async () => {
    const response = await register("alice", { displayName: "Zoé 🏐 Nguyễn", ageConfirmed: true });

    expect(response.statusCode).toBe(200);
    expect(response.json().displayName).toBe("Zoé 🏐 Nguyễn");
  });

  test("rejects a request without a token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users/me",
      payload: { displayName: "Alice", ageConfirmed: true },
    });

    expect(response.statusCode).toBe(401);
    expect(await testDb.user.count()).toBe(0);
  });

  test("rejects an invalid token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users/me",
      headers: { authorization: "Bearer not-a-real-token" },
      payload: { displayName: "Alice", ageConfirmed: true },
    });

    expect(response.statusCode).toBe(401);
  });

  test.each([
    ["the age is not confirmed", { displayName: "Alice", ageConfirmed: false }],
    ["the name is blank", { displayName: "   ", ageConfirmed: true }],
    ["the name is missing", { ageConfirmed: true }],
    ["the name is too long", { displayName: "a".repeat(101), ageConfirmed: true }],
    ["the name has an invisible character", { displayName: "a\u0000b", ageConfirmed: true }],
    ["the name has a line break", { displayName: "Alice\nBob", ageConfirmed: true }],
  ])("rejects the request when %s", async (_, body) => {
    const response = await register("alice", body);

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Some of the details you sent aren't valid." });
    expect(await testDb.user.count()).toBe(0);
  });
});

describe("GET /users/me", () => {
  test("returns 404 before the user is saved", async () => {
    const response = await app.inject({ method: "GET", url: "/users/me", headers: authHeader("alice") });

    expect(response.statusCode).toBe(404);
  });

  test("returns the logged-in user, not someone else", async () => {
    const alice = (await register("alice", { displayName: "Alice", ageConfirmed: true })).json();
    await register("bob", { displayName: "Bob", ageConfirmed: true });

    const response = await app.inject({ method: "GET", url: "/users/me", headers: authHeader("alice") });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(alice);
  });

  test("adds default badges when an existing profile has none", async () => {
    await register("alice", { displayName: "Alice", ageConfirmed: true });
    await testDb.userBadge.deleteMany();

    const response = await app.inject({ method: "GET", url: "/users/me", headers: authHeader("alice") });

    expect(response.statusCode).toBe(200);
    expect(response.json().badges).toHaveLength(4);
  });

  test("restores only the missing default badges", async () => {
    await register("alice", { displayName: "Alice", ageConfirmed: true });
    const user = await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } });
    const [badgeToRemove] = await testDb.userBadge.findMany({
      where: { userId: user.id },
      take: 1,
    });
    await testDb.userBadge.delete({
      where: {
        userId_badgeTypeId: {
          userId: user.id,
          badgeTypeId: badgeToRemove.badgeTypeId,
        },
      },
    });

    const response = await app.inject({ method: "GET", url: "/users/me", headers: authHeader("alice") });

    expect(response.statusCode).toBe(200);
    expect(response.json().badges).toHaveLength(4);
    expect(await testDb.userBadge.count({ where: { userId: user.id } })).toBe(4);
  });

  test("keeps default badges idempotent across repeated profile loads", async () => {
    await register("alice", { displayName: "Alice", ageConfirmed: true });

    await app.inject({ method: "GET", url: "/users/me", headers: authHeader("alice") });
    await app.inject({ method: "GET", url: "/users/me", headers: authHeader("alice") });

    const user = await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } });
    expect(await testDb.userBadge.count({ where: { userId: user.id } })).toBe(4);
  });

  test("rejects a request without a token", async () => {
    const response = await app.inject({ method: "GET", url: "/users/me" });

    expect(response.statusCode).toBe(401);
  });

  test("accepts 'bearer' written in lower case", async () => {
    await register("alice", { displayName: "Alice", ageConfirmed: true });

    const response = await app.inject({
      method: "GET",
      url: "/users/me",
      headers: { authorization: "bearer token-alice" },
    });

    expect(response.statusCode).toBe(200);
  });
});

describe("DELETE /users/me", () => {
  const remove = (uid: string) =>
    app.inject({ method: "DELETE", url: "/users/me", headers: authHeader(uid) });

  test("deletes the logged-in user and nobody else", async () => {
    await register("alice", { displayName: "Alice", ageConfirmed: true });
    await register("bob", { displayName: "Bob", ageConfirmed: true });

    const response = await remove("alice");

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    const remaining = await testDb.user.findMany();
    expect(remaining.map((user) => user.firebaseUid)).toEqual(["bob"]);
  });

  test("is safe to retry when the user is already gone", async () => {
    const response = await remove("alice");

    expect(response.statusCode).toBe(204);
  });

  test("rejects a request without a token", async () => {
    await register("alice", { displayName: "Alice", ageConfirmed: true });

    const response = await app.inject({ method: "DELETE", url: "/users/me" });

    expect(response.statusCode).toBe(401);
    expect(await testDb.user.count()).toBe(1);
  });
});
