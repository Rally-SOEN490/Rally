// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
beforeEach(() => testDb.user.deleteMany());
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const register = (uid: string, body: object = { displayName: uid, ageConfirmed: true }) =>
  app.inject({ method: "POST", url: "/users/me", headers: authHeader(uid), payload: body });
const getMe = (uid: string) =>
  app.inject({ method: "GET", url: "/users/me", headers: authHeader(uid) });
const saved = (uid: string) => testDb.user.findUniqueOrThrow({ where: { firebaseUid: uid } });

describe("a new account's role", () => {
  test("is player", async () => {
    const response = await register("alice");

    expect(response.json().role).toBe("PLAYER");
    expect((await saved("alice")).role).toBe("PLAYER");
  });

  test("stays player when sign-up sends a different role", async () => {
    const response = await register("alice", {
      displayName: "Alice",
      ageConfirmed: true,
      role: "ADMIN",
    });

    expect(response.json().role).toBe("PLAYER");
    expect((await saved("alice")).role).toBe("PLAYER");
  });
});

describe("an account's role", () => {
  test.each(["ORGANIZER", "ADMIN"] as const)("is sent to its owner as %s", async (role) => {
    await register("alice");
    await testDb.user.update({ where: { firebaseUid: "alice" }, data: { role } });

    expect((await getMe("alice")).json().role).toBe(role);
  });

  test.each([
    ["alone", { role: "ORGANIZER" }],
    ["with an allowed change", { role: "ADMIN", darkMode: true }],
  ])("can't be changed with PATCH /users/me %s", async (_, payload) => {
    await register("alice");

    const response = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: authHeader("alice"),
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(await saved("alice")).toMatchObject({ role: "PLAYER", darkMode: false });
  });

  test("is not shown to other players in the directory", async () => {
    await register("alice");
    await testDb.user.update({ where: { firebaseUid: "alice" }, data: { role: "ORGANIZER" } });

    const directory = await app.inject({
      method: "GET",
      url: "/users",
      headers: authHeader("bob"),
    });

    expect(directory.json()).toHaveLength(1);
    expect(directory.json()[0]).not.toHaveProperty("role");
  });
});
