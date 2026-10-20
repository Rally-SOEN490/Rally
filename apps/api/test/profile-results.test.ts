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
const entry = (extra: Partial<RegistrationSnapshot> = {}): RegistrationSnapshot => ({
  userId: alice, registrationId: randomUUID(), eventName: "Spring Rally", tournamentName: "Mixed 6s", teamName: "Original team", format: "Indoor 6s",
  startsAt: new Date("2030-05-01T10:00:00Z"), endsAt: new Date("2030-05-01T18:00:00Z"), state: "CONFIRMED", ...extra,
});
const complete = async (snapshot: RegistrationSnapshot, placement = 2) => {
  await service.syncRegistration(snapshot); await service.finalizeResult(snapshot.userId, snapshot.registrationId, placement, now);
};
test("returns newest finalized results only for the owner, with stable ties", async () => {
  const old = entry({ startsAt: new Date("2030-04-01T10:00:00Z"), endsAt: new Date("2030-04-01T18:00:00Z") });
  const one = entry({ registrationId: "00000000-0000-4000-8000-000000000001" });
  const two = entry({ registrationId: "00000000-0000-4000-8000-000000000002" });
  await complete(old); await complete(two); await complete(one);
  await complete(entry({ userId: bob })); await service.syncRegistration(entry());
  await service.syncRegistration(entry({ state: "CANCELLED" }));
  const result = await service.history("alice", now);
  expect(result.results.map((row) => row.id)).toEqual([one.registrationId, two.registrationId, old.registrationId]);
  expect(Object.keys(result.results[0]).sort()).toEqual(["endedAt", "eventName", "id", "placement", "teamName", "tournamentName"]);
  expect(result.results[0].placement).toBe(2);
});
test("finalization is repeatable, supports trusted corrections and keeps historical team names", async () => {
  const snapshot = entry(); await complete(snapshot);
  await service.finalizeResult(alice, snapshot.registrationId, 2, now);
  await service.syncRegistration({ ...snapshot, teamName: "Current team renamed", eventName: "Renamed event" });
  await service.finalizeResult(alice, snapshot.registrationId, 1, now);
  expect((await service.history("alice", now)).results[0]).toMatchObject({ teamName: "Original team", eventName: "Spring Rally", placement: 1 });
  expect(await testDb.profileParticipation.count()).toBe(1);
});
test.each([0, -1, 1.5, NaN, 2147483648])("rejects invalid placement %s", async (placement) => {
  const snapshot = entry(); await service.syncRegistration(snapshot);
  await expect(service.finalizeResult(alice, snapshot.registrationId, placement, now)).rejects.toThrow("Invalid finalized result");
  expect((await service.history("alice", now)).results).toEqual([]);
});
test("refuses to finalize cancelled, future, missing and other-account participations", async () => {
  const cancelled = entry({ state: "CANCELLED" }); await service.syncRegistration(cancelled);
  const future = entry({ startsAt: new Date("2030-07-01T10:00:00Z"), endsAt: new Date("2030-07-01T18:00:00Z") }); await service.syncRegistration(future);
  const other = entry({ userId: bob }); await service.syncRegistration(other);
  for (const id of [cancelled.registrationId, future.registrationId, randomUUID(), other.registrationId]) {
    await expect(service.finalizeResult(alice, id, 1, now)).rejects.toThrow("No eligible completed participation");
  }
});
test("finalization participates in the producer transaction", async () => {
  const snapshot = entry(); await service.syncRegistration(snapshot);
  await expect(testDb.$transaction(async (tx) => {
    await createParticipationService(createParticipationRepository(tx)).finalizeResult(alice, snapshot.registrationId, 1, now);
    throw new Error("Standings not committed");
  })).rejects.toThrow("Standings not committed");
  expect((await service.history("alice", now)).results).toEqual([]);
});
test("completed entries disappear from the upcoming API", async () => {
  const snapshot = entry(); await complete(snapshot);
  expect((await service.upcoming("alice", new Date("2030-01-01"))).tournaments).toEqual([]);
});
test("history endpoint is authenticated, owner-only, no-store, and exposes no player write route", async () => {
  const snapshot = entry({ startsAt: new Date("2020-01-01T10:00:00Z"), endsAt: new Date("2020-01-01T18:00:00Z") }); await complete(snapshot);
  const read = (uid: string) => app.inject({ method: "GET", url: "/profiles/me/results", headers: authHeader(uid) });
  expect((await app.inject({ method: "GET", url: "/profiles/me/results" })).statusCode).toBe(401);
  expect((await read("unknown")).statusCode).toBe(404);
  expect((await read("bob")).json()).toEqual({ results: [] });
  const response = await read("alice");
  expect(response.json().results).toHaveLength(1); expect(response.headers["cache-control"]).toBe("no-store");
  expect((await app.inject({ method: "PATCH", url: "/profiles/me/results", headers: authHeader("alice"), payload: { placement: 1 } })).statusCode).toBe(404);
});
