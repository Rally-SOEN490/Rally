// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";
import { defaultPrivacy } from "../src/modules/profiles/privacy.ts";

const app = await buildTestApp();
beforeEach(async () => {
  await testDb.user.deleteMany();
  await testDb.user.createMany({ data: ["alice", "bob"].map((firebaseUid) => ({
    firebaseUid, displayName: firebaseUid, ageConfirmedAt: new Date(),
  })) });
});
afterAll(async () => { await app.close(); await testDb.$disconnect(); });
const get = (uid = "alice") => app.inject({ method: "GET", url: "/profiles/me/privacy", headers: authHeader(uid) });
const save = (payload: object, uid = "alice") => app.inject({
  method: "PATCH", url: "/profiles/me/privacy", headers: authHeader(uid), payload,
});

describe("profile privacy", () => {
  test("existing and new accounts default to private without a database write", async () => {
    const response = await get();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(defaultPrivacy);
    expect(await testDb.profilePrivacy.count()).toBe(0);
    expect(response.headers["cache-control"]).toBe("private, no-store");
  });
  test("saves every preference in PostgreSQL and returns no internal fields", async () => {
    const settings = Object.fromEntries(Object.keys(defaultPrivacy).map((key) => [key, true]));
    expect((await save(settings)).json()).toEqual(settings);
    expect((await get()).json()).toEqual(settings);
    expect((await get("bob")).json()).toEqual(defaultPrivacy);
    const alice = await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } });
    expect(await testDb.profilePrivacy.findUnique({ where: { userId: alice.id } })).toMatchObject(settings);
  });
  test("partial updates preserve the other choices and are safe to retry", async () => {
    await save({ profileVisible: true, showBio: true });
    await save({ showBadges: true });
    await save({ showBadges: true });
    expect((await get()).json()).toEqual({ ...defaultPrivacy, profileVisible: true, showBio: true, showBadges: true });
    expect(await testDb.profilePrivacy.count()).toBe(1);
  });
  test("the token controls the owner even if the body names another account", async () => {
    const bob = await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "bob" } });
    await save({ userId: bob.id, profileVisible: true });
    expect((await get()).json().profileVisible).toBe(true);
    expect((await get("bob")).json()).toEqual(defaultPrivacy);
  });
  test.each(["GET", "PATCH"] as const)("requires authentication for %s", async (method) => {
    const response = await app.inject({ method, url: "/profiles/me/privacy", ...(method === "PATCH" && { payload: { showBadges: true } }) });
    expect(response.statusCode).toBe(401);
  });
  test("rejects an invalid login token", async () => {
    expect((await app.inject({ method: "GET", url: "/profiles/me/privacy", headers: { authorization: "Bearer invalid" } })).statusCode).toBe(401);
  });
  test("requires a Rally account for both reads and writes", async () => {
    expect((await get("missing")).statusCode).toBe(404);
    expect((await save({ profileVisible: true }, "missing")).statusCode).toBe(404);
    expect(await testDb.profilePrivacy.count()).toBe(0);
  });
  test.each([{}, { profileVisible: "invalid" }, { showBadges: null }])("rejects invalid preferences %j", async (payload) => {
    expect((await save(payload)).statusCode).toBe(400);
  });
  test("deleting the account also deletes its preferences", async () => {
    await save({ profileVisible: true });
    await testDb.user.delete({ where: { firebaseUid: "alice" } });
    expect(await testDb.profilePrivacy.count()).toBe(0);
  });
});
