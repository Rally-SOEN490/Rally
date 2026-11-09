// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test } from "vitest";
import { testDb } from "./helpers.ts";
import {
  buildTournamentTestApp,
  coedB,
  createAccount,
  hoursFromNow,
  saveTournament,
  tournamentCalls,
  womenA,
} from "./tournament-helpers.ts";

const app = await buildTournamentTestApp();
const call = tournamentCalls(app);

// "Verdun Volley" organizes a published tournament (`published`) and a draft
// (`draft`). Starts on Nov 15, 2027 at 9:00 in Montreal.
let organizerId: string;
let published: string;
let draft: string;
beforeEach(async () => {
  await testDb.user.deleteMany();
  organizerId = (await createAccount("Verdun Volley")).id;
  await createAccount("player", "PLAYER");
  const dates = {
    startsAt: new Date("2027-11-15T14:00:00Z"),
    endsAt: new Date("2027-11-16T00:00:00Z"),
  };
  published = (await saveTournament(organizerId, "Verdun Winter Cup", dates, [coedB, womenA])).id;
  draft = (await saveTournament(organizerId, "Draft Cup", { ...dates, status: "DRAFT" })).id;
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const division = (name: string, rest: object) => ({
  id: expect.any(String),
  name,
  registeredTeams: 0,
  ...rest,
});
const divisions = [
  division("6v6 Co-ed B / B+", {
    format: "6v6",
    type: "coed",
    levels: ["B", "B+"],
    maxTeams: 15,
    priceCents: 24000,
  }),
  division("4v4 Women A", {
    format: "4v4",
    type: "women",
    levels: ["A"],
    maxTeams: 8,
    priceCents: 12050,
  }),
];

// ---------- Who sees what ----------

test("shows a player a published tournament with its description, and nothing private", async () => {
  const response = await call.get("player", published);

  expect(response.statusCode).toBe(200);
  // Exact match: no organizer id, status, courts or publishing date.
  expect(response.json()).toEqual({
    id: published,
    name: "Verdun Winter Cup",
    location: "Verdun Auditorium",
    description: "🏐 The best 6s day of the year!\n\n  • 3 pool games",
    startsAt: "2027-11-15T09:00",
    endsAt: "2027-11-15T19:00",
    registrationOpensAt: "2027-10-16T10:00",
    registrationClosesAt: "2027-11-14T09:00",
    organizerName: "Verdun Volley",
    divisions,
    isOrganizer: false,
    signUps: "NOT_OPEN",
  });
});

test("shows the organizer their own tournament with everything they set up", async () => {
  const response = await call.get("Verdun Volley", published);

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    id: published,
    status: "PUBLISHED",
    courts: 3,
    publishedAt: expect.any(String),
    organizerName: "Verdun Volley",
    divisions,
    registeredTeams: 0,
    isOrganizer: true,
  });
});

test("shows the organizer their own draft", async () => {
  const response = await call.get("Verdun Volley", draft);

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ status: "DRAFT", isOrganizer: true });
});

test.each([
  ["a player", "player", "PLAYER"],
  ["another organizer", "rival", "ORGANIZER"],
  ["an admin", "admin", "ADMIN"],
] as const)("answers not found when %s asks for a draft", async (_, uid, role) => {
  if (uid !== "player") await createAccount(uid, role);

  const response = await call.get(uid, draft);

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ message: "Tournament not found." });
});

test("treats a demoted organizer as a player", async () => {
  await testDb.user.update({ where: { id: organizerId }, data: { role: "PLAYER" } });

  expect((await call.get("Verdun Volley", draft)).statusCode).toBe(404);
  const response = await call.get("Verdun Volley", published);
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ isOrganizer: false });
  expect(response.json()).not.toHaveProperty("status");
});

test("shows an admin or another organizer the player's view", async () => {
  await createAccount("rival");
  await createAccount("admin", "ADMIN");

  for (const uid of ["rival", "admin"]) {
    const response = await call.get(uid, published);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ isOrganizer: false });
    expect(response.json()).not.toHaveProperty("status");
  }
});

test("shows a published tournament to someone without a Rally account yet", async () => {
  const response = await call.get("no-account-yet", published);

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ isOrganizer: false });
});

test("still shows a tournament that has ended", async () => {
  const ended = await saveTournament(organizerId, "Ended Cup", {
    startsAt: hoursFromNow(-30),
    endsAt: hoursFromNow(-20),
  });

  const response = await call.get("player", ended.id);

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ name: "Ended Cup", signUps: "CLOSED" });
});

test("answers not found for a tournament that doesn't exist", async () => {
  const response = await call.get("player", "00000000-0000-4000-8000-000000000000");

  expect(response.statusCode).toBe(404);
});

test("asks to log in first", async () => {
  const response = await app.inject({ method: "GET", url: `/tournaments/${published}` });

  expect(response.statusCode).toBe(401);
});

// ---------- Sign-ups ----------

test.each([
  ["NOT_OPEN", "before registration opens", 2, 10],
  ["OPEN", "while registration is open", -2, 10],
  ["CLOSED", "after registration closes", -10, -2],
] as const)("says sign-ups are %s %s", async (signUps, _, opensIn, closesIn) => {
  const { id } = await saveTournament(organizerId, "Timed Cup", {
    startsAt: hoursFromNow(48),
    endsAt: hoursFromNow(58),
    registrationOpensAt: hoursFromNow(opensIn),
    registrationClosesAt: hoursFromNow(closesIn),
  });

  expect((await call.get("player", id)).json()).toMatchObject({ signUps });
});

test("says sign-ups aren't open for a draft without registration dates", async () => {
  await testDb.tournament.update({
    where: { id: draft },
    data: { registrationOpensAt: null, registrationClosesAt: null },
  });

  expect((await call.get("Verdun Volley", draft)).json()).toMatchObject({ signUps: "NOT_OPEN" });
});
