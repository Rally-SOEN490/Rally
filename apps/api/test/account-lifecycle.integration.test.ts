/*
AI declaration:
50% or more AI-generated
*/

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();

beforeEach(() => testDb.user.deleteMany());
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const request = (
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  uid: string,
  payload?: object,
) =>
  app.inject({
    method,
    url,
    headers: authHeader(uid),
    ...(payload === undefined ? {} : { payload }),
  });

describe("account lifecycle integration", () => {
  test("registers, reads, updates, and deletes one account without affecting another", async () => {
    const registerAlice = await request("POST", "/users/me", "alice", {
      displayName: " Alice ",
      ageConfirmed: true,
    });
    const registerBob = await request("POST", "/users/me", "bob", {
      displayName: "Bob",
      ageConfirmed: true,
    });

    expect(registerAlice.statusCode).toBe(200);
    expect(registerAlice.json().displayName).toBe("Alice");
    expect(registerBob.statusCode).toBe(200);

    const updatedAlice = await request("PATCH", "/users/me", "alice", {
      lookingForTeam: true,
    });
    expect(updatedAlice.statusCode).toBe(200);
    expect(updatedAlice.json()).toMatchObject({
      displayName: "Alice",
      lookingForTeam: true,
    });

    const alice = await request("GET", "/users/me", "alice");
    const bob = await request("GET", "/users/me", "bob");
    expect(alice.statusCode).toBe(200);
    expect(alice.json()).toMatchObject({ displayName: "Alice", lookingForTeam: true });
    expect(bob.statusCode).toBe(200);
    expect(bob.json()).toMatchObject({ displayName: "Bob", lookingForTeam: false });

    const deletedAlice = await request("DELETE", "/users/me", "alice");
    expect(deletedAlice.statusCode).toBe(204);

    const missingAlice = await request("GET", "/users/me", "alice");
    const remainingBob = await request("GET", "/users/me", "bob");
    expect(missingAlice.statusCode).toBe(404);
    expect(remainingBob.statusCode).toBe(200);
    expect(await testDb.user.count()).toBe(1);
  });

  test("does not allow an unauthenticated request to enter the lifecycle", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users/me",
      payload: { displayName: "Alice", ageConfirmed: true },
    });

    expect(response.statusCode).toBe(401);
    expect(await testDb.user.count()).toBe(0);
  });
});
