// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, beforeEach, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";
const app = await buildTestApp();
beforeEach(async () => {
  await testDb.user.deleteMany();
  await testDb.user.createMany({ data: ["alice", "bob"].map((firebaseUid) => ({
    firebaseUid, displayName: firebaseUid, ageConfirmedAt: new Date(),
  })) });
});
afterAll(async () => { await app.close(); await testDb.$disconnect(); });
const read = (uid = "alice") => app.inject({ method: "GET", url: "/profiles/me/message", headers: authHeader(uid) });
const save = (payload: unknown, uid = "alice") => app.inject({ method: "PATCH", url: "/profiles/me/message", payload: JSON.stringify(payload), headers: { ...authHeader(uid), "content-type": "application/json" } });

test("existing accounts start empty, reads do not create rows, and responses are not cached", async () => {
  const response = await read();
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ message: "" });
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(await testDb.profileMessage.count()).toBe(0);
});
test("saves, trims, replaces and removes a persisted message", async () => {
  expect((await save({ message: "  Excited for the weekend 🏐  " })).json()).toEqual({ message: "Excited for the weekend 🏐" });
  expect((await read()).json()).toEqual({ message: "Excited for the weekend 🏐" });
  expect((await save({ message: "New update\nSecond line" })).statusCode).toBe(200);
  expect((await read()).json()).toEqual({ message: "New update\nSecond line" });
  expect((await save({ message: "   " })).json()).toEqual({ message: "" });
  expect((await read()).json()).toEqual({ message: "" });
});
test("allows 280 Unicode characters including emoji", async () => {
  const message = "🏐".repeat(280);
  expect((await save({ message })).statusCode).toBe(200);
  expect((await read()).json()).toEqual({ message });
});
test.each([{}, [], null, { message: null }, { message: 7 }, { message: "a".repeat(281) }, { message: "a\u0000b" }, { message: "hello", userId: "bob" }])("rejects malformed or oversized bodies: %j", async (payload) => {
  expect((await save(payload)).statusCode).toBe(400);
  expect((await read()).json()).toEqual({ message: "" });
});
test("only reads and edits the token owner's message", async () => {
  await save({ message: "Alice update" });
  await save({ message: "Bob update" }, "bob");
  expect((await read()).json()).toEqual({ message: "Alice update" });
  expect((await read("bob")).json()).toEqual({ message: "Bob update" });
});
test.each(["GET", "PATCH"] as const)("requires a valid token for %s", async (method) => {
  for (const headers of [{}, { authorization: "Bearer invalid" }]) {
    const response = await app.inject({ method, url: "/profiles/me/message", headers, ...(method === "PATCH" && { payload: { message: "hi" } }) });
    expect(response.statusCode).toBe(401);
  }
});
test("rejects authenticated users without a Rally account", async () => {
  expect((await read("unknown")).statusCode).toBe(404);
  expect((await save({ message: "hi" }, "unknown")).statusCode).toBe(404);
});
test("account deletion removes the saved message", async () => {
  await save({ message: "Delete with account" });
  await testDb.user.delete({ where: { firebaseUid: "alice" } });
  expect(await testDb.profileMessage.count()).toBe(0);
});
