// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";
import { createParticipationRepository } from "../src/modules/profile-participation/repository.ts";
import { createParticipationService, type RegistrationSnapshot } from "../src/modules/profile-participation/service.ts";
const app = await buildTestApp();
const service = createParticipationService(createParticipationRepository(testDb));
let alice: string, bob: string;
const now = new Date("2030-06-01T12:00:00Z");
beforeEach(async () => {
  await testDb.user.deleteMany();
  alice = (await testDb.user.create({ data: { firebaseUid: "alice", displayName: "Alice", ageConfirmedAt: now } })).id;
  bob = (await testDb.user.create({ data: { firebaseUid: "bob", displayName: "Bob", ageConfirmedAt: now } })).id;
});
afterAll(async () => { await app.close(); await testDb.$disconnect(); });
const snapshot = (extra: Partial<RegistrationSnapshot> = {}): RegistrationSnapshot => ({
  userId: alice, registrationId: randomUUID(), eventName: "Summer Rally", tournamentName: "Mixed 6s",
  teamName: "Sunbirds", format: "Indoor 6s", startsAt: new Date("2030-07-01T10:00:00Z"), endsAt: new Date("2030-07-01T18:00:00Z"), state: "CONFIRMED", ...extra,
});
test("returns an empty list for existing users without participation", async () => {
  const response = await app.inject({ method: "GET", url: "/profiles/me/upcoming", headers: authHeader("alice") });
  expect(response.statusCode).toBe(200); expect(response.json()).toEqual({ tournaments: [] });
  expect(response.headers["cache-control"]).toBe("no-store");
});
test("orders confirmed future participation and excludes cancelled, started, completed and other owners", async () => {
  const near = snapshot(); const late = snapshot({ startsAt: new Date("2030-08-01T10:00:00Z"), endsAt: new Date("2030-08-01T18:00:00Z") });
  await service.syncRegistration(late); await service.syncRegistration(near);
  await service.syncRegistration(snapshot({ userId: bob }));
  await service.syncRegistration(snapshot({ state: "CANCELLED" }));
  await service.syncRegistration(snapshot({ startsAt: now }));
  const done = snapshot(); await service.syncRegistration(done);
  await testDb.profileParticipation.update({ where: { userId_registrationId: { userId: alice, registrationId: done.registrationId } }, data: { state: "COMPLETED" } });
  const response = await service.upcoming("alice", now);
  expect(response.tournaments.map((entry) => entry.id)).toEqual([near.registrationId, late.registrationId]);
  expect(Object.keys(response.tournaments[0]).sort()).toEqual(["eventName", "format", "id", "startsAt", "teamName", "tournamentName"]);
});
test("uses a stable registration ID as the chronological tie breaker", async () => {
  const first = snapshot({ registrationId: "00000000-0000-4000-8000-000000000001" });
  const second = snapshot({ registrationId: "00000000-0000-4000-8000-000000000002" });
  await service.syncRegistration(second); await service.syncRegistration(first);
  expect((await service.upcoming("alice", now)).tournaments.map((entry) => entry.id)).toEqual([first.registrationId, second.registrationId]);
});
test("trusted registration sync is repeatable and reflects cancellation", async () => {
  const entry = snapshot(); await service.syncRegistration(entry); await service.syncRegistration(entry);
  expect(await testDb.profileParticipation.count()).toBe(1);
  await service.syncRegistration({ ...entry, state: "CANCELLED" });
  expect((await service.upcoming("alice", now)).tournaments).toEqual([]);
});
test("late roster updates cannot rewrite a completed team snapshot", async () => {
  const entry = snapshot(); await service.syncRegistration(entry);
  await testDb.profileParticipation.update({ where: { userId_registrationId: { userId: alice, registrationId: entry.registrationId } }, data: { state: "COMPLETED" } });
  await service.syncRegistration({ ...entry, teamName: "Changed current team" });
  expect((await testDb.profileParticipation.findFirstOrThrow()).teamName).toBe("Sunbirds");
});
test("registration sync works in the producer transaction and rolls back with it", async () => {
  await expect(testDb.$transaction(async (tx) => {
    await createParticipationService(createParticipationRepository(tx)).syncRegistration(snapshot());
    throw new Error("Producer failed");
  })).rejects.toThrow("Producer failed");
  expect(await testDb.profileParticipation.count()).toBe(0);
});
test.each([{ teamName: "" }, { format: "x".repeat(101) }, { startsAt: new Date("invalid") }, { endsAt: new Date("2020-01-01") }, { registrationId: "bad" }])("rejects invalid trusted input %j", async (extra) => {
  await expect(service.syncRegistration(snapshot(extra))).rejects.toThrow("Invalid registration snapshot");
  expect(await testDb.profileParticipation.count()).toBe(0);
});
test("requires authentication and an existing Rally account; player writes are unavailable", async () => {
  expect((await app.inject({ method: "GET", url: "/profiles/me/upcoming" })).statusCode).toBe(401);
  expect((await app.inject({ method: "GET", url: "/profiles/me/upcoming", headers: { authorization: "Bearer invalid" } })).statusCode).toBe(401);
  expect((await app.inject({ method: "GET", url: "/profiles/me/upcoming", headers: authHeader("unknown") })).statusCode).toBe(404);
  expect((await app.inject({ method: "PATCH", url: "/profiles/me/upcoming", headers: authHeader("alice"), payload: { teamName: "Cheat" } })).statusCode).toBe(404);
});
