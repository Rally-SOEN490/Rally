// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test } from "vitest";
import { testDb } from "./helpers.ts";
import {
  buildTournamentTestApp,
  completeSetup,
  createAccount,
  sampleDivision,
  tournamentCalls,
} from "./tournament-helpers.ts";

const app = await buildTournamentTestApp();
const call = tournamentCalls(app);

// The organizer has a complete draft, `id`, with no divisions yet.
let id: string;
beforeEach(async () => {
  await testDb.user.deleteMany();
  await createAccount("organizer");
  id = (await call.create("organizer", { name: "Verdun Winter Cup", ...completeSetup })).json().id;
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const addDivision = async (payload: object = sampleDivision) =>
  (await call.addDivision("organizer", id, payload)).json().divisions.at(-1);

// ---------- Divisions ----------

test("adds a division and returns the tournament with it", async () => {
  const response = await call.addDivision("organizer", id);

  expect(response.statusCode).toBe(201);
  expect(response.json().divisions).toEqual([{ id: expect.any(String), ...sampleDivision }]);
});

test("returns levels in their natural order", async () => {
  const division = await addDivision({ ...sampleDivision, levels: ["Elite", "C-", "B+"] });

  expect(division.levels).toEqual(["C-", "B+", "Elite"]);
});

test.each([
  ["no levels", { levels: [] }],
  ["the same level twice", { levels: ["B", "B"] }],
  ["an unknown format", { format: "5v5" }],
  ["an unknown level", { levels: ["D"] }],
  ["an unknown type", { type: "mixed" }],
  ["one team", { maxTeams: 1 }],
  ["65 teams", { maxTeams: 65 }],
  ["a negative price", { priceCents: -100 }],
  ["a price in dollars with cents", { priceCents: 24.5 }],
  ["a blank name", { name: "  " }],
])("rejects a division with %s", async (_, change) => {
  const response = await call.addDivision("organizer", id, { ...sampleDivision, ...change });

  expect(response.statusCode).toBe(400);
  expect(await testDb.division.count()).toBe(0);
});

test("rejects a second division with the same name", async () => {
  await addDivision();

  const response = await call.addDivision("organizer", id, { ...sampleDivision, maxTeams: 8 });

  expect(response.statusCode).toBe(409);
  expect(response.json()).toEqual({
    message: "This tournament already has a division with that name.",
  });
});

test("edits and removes a division", async () => {
  const division = await addDivision();

  const edited = await call.updateDivision("organizer", id, division.id, {
    maxTeams: 12,
    name: "6v6 B",
  });
  const removed = await call.removeDivision("organizer", id, division.id);

  expect(edited.json().divisions[0]).toMatchObject({ name: "6v6 B", maxTeams: 12 });
  expect(removed.json().divisions).toEqual([]);
});

test("won't touch a division through another tournament", async () => {
  const division = await addDivision();
  const other = (await call.create("organizer", { name: "Other Cup" })).json().id;

  const response = await call.removeDivision("organizer", other, division.id);

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ message: "Division not found." });
  expect(await testDb.division.count()).toBe(1);
});

test("rejects a division id that isn't a UUID as invalid", async () => {
  const response = await call.updateDivision("organizer", id, "-".repeat(36), { name: "B" });

  expect(response.statusCode).toBe(400);
});

// The API already rejects these. The database check catches them if a bug or a
// manual edit gets past the API.
test.each([
  ["no levels", "NULL"],
  ["an empty list", "'{}'"],
  ["a blank level", "ARRAY['B', NULL]"],
])("the database refuses a division with %s", async (_, levels) => {
  const insert = testDb.$executeRawUnsafe(
    `INSERT INTO "divisions" ("id", "tournament_id", "name", "format", "type", "levels",
       "max_teams", "price_cents", "updated_at")
     VALUES (gen_random_uuid(), $1::uuid, 'Raw', '6v6', 'COED', ${levels}::"division_level"[],
       8, 0, now())`,
    id,
  );

  await expect(insert).rejects.toThrow(/divisions_levels_check/);
});

// ---------- Publishing ----------

test("publishes a complete draft with a division", async () => {
  await addDivision();

  const response = await call.publish("organizer", id);

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ status: "PUBLISHED", publishedAt: expect.any(String) });
});

test("won't publish without a division", async () => {
  const response = await call.publish("organizer", id);

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({ message: "Not ready to publish. Add at least one division." });
  expect((await testDb.tournament.findFirstOrThrow()).status).toBe("DRAFT");
});

test("lists what's missing from an incomplete draft", async () => {
  const draft = (await call.create("organizer", { name: "Bare" })).json().id;
  await call.addDivision("organizer", draft);

  const response = await call.publish("organizer", draft);

  expect(response.statusCode).toBe(400);
  expect(response.json().message).toMatch(
    /^Not ready to publish\. Add a location, the number of courts/,
  );
});

test("won't publish a tournament that already started", async () => {
  await addDivision();
  await call.update("organizer", id, {
    startsAt: "2026-01-10T09:00",
    endsAt: "2026-01-10T19:00",
    registrationOpensAt: "2025-12-01T09:00",
    registrationClosesAt: "2026-01-05T09:00",
  });

  const response = await call.publish("organizer", id);

  expect(response.json().message).toContain("The tournament must start in the future.");
});

test("freezes a published tournament until editing exists (#80)", async () => {
  const division = await addDivision();
  await call.publish("organizer", id);

  const responses = [
    await call.update("organizer", id, { name: "Renamed" }),
    await call.addDivision("organizer", id, { ...sampleDivision, name: "Another" }),
    await call.removeDivision("organizer", id, division.id),
    await call.publish("organizer", id),
  ];

  expect(responses.map((response) => response.statusCode)).toEqual([409, 409, 409, 409]);
  expect(responses[0].json()).toEqual({
    message: "This tournament is published. Editing it isn't available yet.",
  });
});

test("never publishes without a division, even when a removal happens at the same time", async () => {
  const division = await addDivision();

  const [publish, remove] = await Promise.all([
    call.publish("organizer", id),
    call.removeDivision("organizer", id, division.id),
  ]);

  const saved = await testDb.tournament.findFirstOrThrow({ include: { divisions: true } });
  if (saved.status === "PUBLISHED") {
    expect(saved.divisions).toHaveLength(1);
    expect(remove.statusCode).toBe(409);
  } else {
    expect(saved.divisions).toHaveLength(0);
    expect(publish.statusCode).toBe(400);
  }
});

test("publishes once when asked twice at the same time", async () => {
  await addDivision();

  const responses = await Promise.all([
    call.publish("organizer", id),
    call.publish("organizer", id),
  ]);

  expect(responses.map((response) => response.statusCode).sort()).toEqual([200, 409]);
});
