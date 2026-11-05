// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import Fastify from "fastify";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { requireUser, type VerifyIdToken } from "../src/auth.ts";
import { requirePermission } from "../src/authorization.ts";
import { createUserRepository } from "../src/modules/users/repository.ts";
import { authHeader, testDb } from "./helpers.ts";

// No real route needs a permission yet, so this test app has one that does.
const fakeVerifyIdToken: VerifyIdToken = async (token) => {
  if (!token.startsWith("token-")) throw new Error("Invalid token");
  return { uid: token.slice("token-".length) };
};
const findRole = vi.fn(createUserRepository(testDb).findRoleByFirebaseUid);

const app = Fastify();
app.decorateRequest("firebaseUid", "");
app.post(
  "/restricted",
  {
    preHandler: [requireUser(fakeVerifyIdToken), requirePermission(findRole, "tournament:create")],
  },
  () => ({ done: true }),
);

beforeEach(async () => {
  findRole.mockClear();
  await testDb.user.deleteMany();
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const createAccount = (uid: string, role: "PLAYER" | "ORGANIZER" | "ADMIN") =>
  testDb.user.create({
    data: { firebaseUid: uid, displayName: uid, ageConfirmedAt: new Date(), role },
  });

const callRestricted = (uid?: string) =>
  app.inject({ method: "POST", url: "/restricted", headers: uid ? authHeader(uid) : {} });

describe("requirePermission", () => {
  test.each(["ORGANIZER", "ADMIN"] as const)("lets an %s through", async (role) => {
    await createAccount("alice", role);

    const response = await callRestricted("alice");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ done: true });
  });

  test("turns a player away", async () => {
    await createAccount("alice", "PLAYER");

    const response = await callRestricted("alice");

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ message: "You don't have permission to do this." });
  });

  test("turns away someone logged in to Firebase without a Rally account", async () => {
    const response = await callRestricted("nobody");

    expect(response.statusCode).toBe(403);
  });

  test("checks the role of the person calling, not someone else's", async () => {
    await createAccount("organizer", "ORGANIZER");
    await createAccount("player", "PLAYER");

    expect((await callRestricted("player")).statusCode).toBe(403);
    expect(findRole).toHaveBeenCalledWith("player");
  });

  test("applies a role change on the next request", async () => {
    await createAccount("alice", "PLAYER");
    expect((await callRestricted("alice")).statusCode).toBe(403);

    await testDb.user.update({ where: { firebaseUid: "alice" }, data: { role: "ORGANIZER" } });
    expect((await callRestricted("alice")).statusCode).toBe(200);

    await testDb.user.update({ where: { firebaseUid: "alice" }, data: { role: "PLAYER" } });
    expect((await callRestricted("alice")).statusCode).toBe(403);
  });

  test("asks to log in first, without looking up a role", async () => {
    const response = await callRestricted();

    expect(response.statusCode).toBe(401);
    expect(findRole).not.toHaveBeenCalled();
  });
});
