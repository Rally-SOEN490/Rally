// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test } from "vitest";
import { testDb } from "./helpers.ts";
import {
  buildTournamentTestApp,
  completeSetup,
  createAccount,
  tournamentCalls,
} from "./tournament-helpers.ts";

const app = await buildTournamentTestApp();
const call = tournamentCalls(app);

beforeEach(async () => {
  await testDb.user.deleteMany();
  await createAccount("organizer");
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const createDraft = async (payload?: object) => (await call.create("organizer", payload)).json();

// ---------- Who may create ----------

test.each(["ORGANIZER", "ADMIN"] as const)(
  "lets an %s create a draft with only a name",
  async (role) => {
    await createAccount("someone", role);

    const response = await call.create("someone", { name: "  Verdun Winter Cup " });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      status: "DRAFT",
      name: "Verdun Winter Cup",
      location: null,
      courts: null,
      startsAt: null,
      divisions: [],
      registeredTeams: 0,
      publishedAt: null,
    });
  },
);

test("turns a player away", async () => {
  await createAccount("player", "PLAYER");

  const response = await call.create("player");

  expect(response.statusCode).toBe(403);
  expect(await testDb.tournament.count()).toBe(0);
});

test("asks to log in first", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/tournaments",
    payload: { name: "Cup" },
  });

  expect(response.statusCode).toBe(401);
});

// ---------- The setup fields ----------

test("saves the full setup in Montreal time, and the description exactly as typed", async () => {
  const response = await call.create("organizer", { name: "Verdun Winter Cup", ...completeSetup });

  expect(response.json()).toMatchObject({ name: "Verdun Winter Cup", ...completeSetup });
  const saved = await testDb.tournament.findFirstOrThrow();
  expect(saved.startsAt?.toISOString()).toBe("2027-11-15T14:00:00.000Z");
  expect(saved.description).toBe(completeSetup.description);
});

test.each([
  ["the name is missing", { location: "Verdun" }],
  ["the name is blank", { name: "   " }],
  ["the name is too long", { name: "a".repeat(101) }],
  ["there are no courts", { name: "Cup", courts: 0 }],
  ["there are too many courts", { name: "Cup", courts: 51 }],
  ["courts aren't a whole number", { name: "Cup", courts: 2.5 }],
  ["a time has the wrong format", { name: "Cup", startsAt: "Nov 15, 9 AM" }],
  ["the description has a control character", { name: "Cup", description: "a\u0000b" }],
  ["the description is too long", { name: "Cup", description: "a".repeat(5001) }],
  ["it sends an unknown field", { name: "Cup", status: "PUBLISHED" }],
])("rejects a tournament when %s", async (_, payload) => {
  const response = await call.create("organizer", payload);

  expect(response.statusCode).toBe(400);
  expect(await testDb.tournament.count()).toBe(0);
});

test.each([
  [
    "February 30",
    { startsAt: "2027-02-30T09:00" },
    "2027-02-30 09:00 isn't a valid date and time in Montreal.",
  ],
  [
    "an end before the start",
    { startsAt: "2027-11-15T09:00", endsAt: "2027-11-15T08:00" },
    "The end must be after the start.",
  ],
  [
    "registration closing after the start",
    { startsAt: "2027-11-15T09:00", registrationClosesAt: "2027-11-16T09:00" },
    "Registration must close before or when the tournament starts.",
  ],
])("explains a draft with %s", async (_, dates, message) => {
  const response = await call.create("organizer", { name: "Cup", ...dates });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({ message });
});

// ---------- Editing a draft ----------

test("updates a draft, checking new dates against the saved ones", async () => {
  const { id } = await createDraft({ name: "Cup", startsAt: "2027-11-15T09:00" });

  const tooEarly = await call.update("organizer", id, { endsAt: "2027-11-15T08:00" });
  const fine = await call.update("organizer", id, { endsAt: "2027-11-15T19:00", courts: 4 });

  expect(tooEarly.statusCode).toBe(400);
  expect(fine.statusCode).toBe(200);
  expect(fine.json()).toMatchObject({
    startsAt: "2027-11-15T09:00",
    endsAt: "2027-11-15T19:00",
    courts: 4,
  });
});

test("clears a field sent as null, and a blank description", async () => {
  const { id } = await createDraft({ name: "Cup", location: "Verdun", description: "Hi" });

  const response = await call.update("organizer", id, { location: null, description: "  \n " });

  expect(response.json()).toMatchObject({ location: null, description: null });
});

test.each([
  ["no fields", {}],
  ["an unknown field", { organizerId: "00000000-0000-4000-8000-000000000000" }],
])("rejects an update with %s", async (_, payload) => {
  const { id } = await createDraft();

  expect((await call.update("organizer", id, payload)).statusCode).toBe(400);
});

// ---------- Only the organizer sees and changes their tournament ----------

test("hides a tournament from another organizer", async () => {
  await createAccount("rival");
  const { id } = await createDraft();

  const responses = [
    await call.get("rival", id),
    await call.update("rival", id, { name: "Mine now" }),
    await call.addDivision("rival", id),
    await call.publish("rival", id),
  ];

  expect(responses.map((response) => response.statusCode)).toEqual([404, 404, 404, 404]);
  expect((await testDb.tournament.findFirstOrThrow()).name).toBe("Verdun Winter Cup");
});

test("answers not found for a tournament that doesn't exist", async () => {
  const response = await call.get("organizer", "00000000-0000-4000-8000-000000000000");

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ message: "Tournament not found." });
});

// Each is 36 characters of digits and dashes, but not a UUID the database accepts.
test.each([
  ["only dashes", "-".repeat(36)],
  ["no dashes", "0".repeat(36)],
  ["dashes in the wrong places", "0000-00000000-4000-8000-000000000000"],
])("rejects a tournament id with %s as invalid", async (_, badId) => {
  const response = await call.get("organizer", badId);

  expect(response.statusCode).toBe(400);
});

test("lists only the caller's tournaments, soonest first and undated last", async () => {
  await createAccount("rival");
  await call.create("rival", { name: "Rival Cup" });
  await createDraft({ name: "Undated" });
  await createDraft({ name: "Later", startsAt: "2027-12-01T09:00" });
  await createDraft({ name: "Sooner", startsAt: "2027-11-01T09:00" });

  const response = await call.listMine("organizer");

  expect(response.json().map((tournament: { name: string }) => tournament.name)).toEqual([
    "Sooner",
    "Later",
    "Undated",
  ]);
});

test("stops a demoted organizer from changing their drafts", async () => {
  const { id } = await createDraft();
  await testDb.user.update({ where: { firebaseUid: "organizer" }, data: { role: "PLAYER" } });

  expect((await call.update("organizer", id, { name: "Changed" })).statusCode).toBe(403);
});

// Fastify's validator turns 0, false or "" into null for fields that allow null,
// unless the schema lists the types; these must be rejected, not cleared.
// (It also turns a number into text, so a location of 0 becomes "0"; that is harmless.)
test.each([
  ["courts sent as false", { courts: false }],
  ["a time sent as false", { startsAt: false }],
])("rejects %s instead of clearing the field", async (_, payload) => {
  const { id } = await createDraft({ name: "Cup", courts: 3, location: "Verdun" });

  expect((await call.update("organizer", id, payload)).statusCode).toBe(400);
  expect(await testDb.tournament.findFirstOrThrow()).toMatchObject({
    courts: 3,
    location: "Verdun",
  });
});

// ---------- Deleting a draft ----------

test("deletes a draft with its divisions", async () => {
  const { id } = await createDraft({ name: "Cup", ...completeSetup });
  await call.addDivision("organizer", id);

  const response = await call.deleteDraft("organizer", id);

  expect(response.statusCode).toBe(204);
  expect(await testDb.tournament.count()).toBe(0);
  expect(await testDb.division.count()).toBe(0);
});

test("won't delete another organizer's draft", async () => {
  await createAccount("rival");
  const { id } = await createDraft();

  expect((await call.deleteDraft("rival", id)).statusCode).toBe(404);
  expect(await testDb.tournament.count()).toBe(1);
});

test("won't delete a published tournament", async () => {
  const { id } = await createDraft({ name: "Cup", ...completeSetup });
  await call.addDivision("organizer", id);
  await call.publish("organizer", id);

  expect((await call.deleteDraft("organizer", id)).statusCode).toBe(409);
  expect(await testDb.tournament.count()).toBe(1);
});

test("won't let a player delete anything", async () => {
  await createAccount("player", "PLAYER");
  const { id } = await createDraft();

  expect((await call.deleteDraft("player", id)).statusCode).toBe(403);
  expect(await testDb.tournament.count()).toBe(1);
});
