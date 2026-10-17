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
    const saved = await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } });
    expect(saved.displayName).toBe("Alice");
    expect(saved.ageConfirmedAt).toBeInstanceOf(Date);
  });

  test("does not send back the Firebase ID", async () => {
    const response = await register("alice", { displayName: "Alice", ageConfirmed: true });

    expect(Object.keys(response.json()).sort()).toEqual(["createdAt", "displayName", "id"]);
  });

  test("is safe to retry and keeps the first record", async () => {
    const first = await register("alice", { displayName: "Alice", ageConfirmed: true });
    const second = await register("alice", { displayName: "Someone else", ageConfirmed: true });

    expect(second.json()).toEqual(first.json());
    expect(await testDb.user.count()).toBe(1);
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
  ])("rejects the request when %s", async (_, body) => {
    const response = await register("alice", body);

    expect(response.statusCode).toBe(400);
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

  test("rejects a request without a token", async () => {
    const response = await app.inject({ method: "GET", url: "/users/me" });

    expect(response.statusCode).toBe(401);
  });
});
