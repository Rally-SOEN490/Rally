// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test } from "vitest";
import { authHeader, testDb } from "./helpers.ts";
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

const browse = (uid: string) =>
  app.inject({ method: "GET", url: "/tournaments", headers: authHeader(uid) });

let organizerId: string;
beforeEach(async () => {
  await testDb.user.deleteMany();
  organizerId = (await createAccount("Verdun Volley")).id;
  await createAccount("player", "PLAYER");
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

// ---------- What players see ----------

test("shows a player every organizer's published tournaments that haven't ended, soonest first", async () => {
  const rival = (await createAccount("Laval Volley")).id;
  await saveTournament(organizerId, "Later Cup", {
    startsAt: hoursFromNow(500),
    endsAt: hoursFromNow(510),
  });
  await saveTournament(rival, "Sooner Cup", {
    startsAt: hoursFromNow(100),
    endsAt: hoursFromNow(110),
  });
  await saveTournament(organizerId, "Happening Now", {
    startsAt: hoursFromNow(-2),
    endsAt: hoursFromNow(4),
  });
  await saveTournament(organizerId, "Ended Cup", {
    startsAt: hoursFromNow(-30),
    endsAt: hoursFromNow(-20),
  });
  await saveTournament(organizerId, "Draft Cup", {
    startsAt: hoursFromNow(50),
    endsAt: hoursFromNow(60),
    status: "DRAFT",
  });

  const response = await browse("player");

  expect(response.statusCode).toBe(200);
  expect(response.json().map((tournament: { name: string }) => tournament.name)).toEqual([
    "Happening Now",
    "Sooner Cup",
    "Later Cup",
  ]);
});

test("sends the card details in Montreal time, and nothing private", async () => {
  await saveTournament(
    organizerId,
    "Verdun Winter Cup",
    {
      startsAt: new Date("2027-11-15T14:00:00Z"),
      endsAt: new Date("2027-11-16T00:00:00Z"),
    },
    [coedB, womenA],
  );

  const [tournament] = (await browse("player")).json();

  // Exact match: no organizer id, status, courts or description.
  expect(tournament).toEqual({
    id: expect.any(String),
    name: "Verdun Winter Cup",
    location: "Verdun Auditorium",
    startsAt: "2027-11-15T09:00",
    endsAt: "2027-11-15T19:00",
    registrationOpensAt: "2027-10-16T10:00",
    registrationClosesAt: "2027-11-14T09:00",
    organizerName: "Verdun Volley",
    divisions: [
      {
        id: expect.any(String),
        name: "6v6 Co-ed B / B+",
        format: "6v6",
        type: "coed",
        levels: ["B", "B+"],
        maxTeams: 15,
        priceCents: 24000,
        registeredTeams: 0,
      },
      {
        id: expect.any(String),
        name: "4v4 Women A",
        format: "4v4",
        type: "women",
        levels: ["A"],
        maxTeams: 8,
        priceCents: 12050,
        registeredTeams: 0,
      },
    ],
  });
});

test("shows a tournament an organizer just published through the API", async () => {
  await createAccount("organizer");
  const { id } = (
    await call.create("organizer", {
      name: "Plateau Spring Cup",
      location: "Plateau Arena",
      courts: 2,
      startsAt: "2027-05-01T09:00",
      endsAt: "2027-05-01T17:00",
      registrationOpensAt: "2027-04-01T09:00",
      registrationClosesAt: "2027-04-25T23:59",
    })
  ).json();
  expect(await browse("player").then((response) => response.json())).toEqual([]);

  await call.addDivision("organizer", id);
  await call.publish("organizer", id);

  expect((await browse("player")).json()).toMatchObject([{ id, name: "Plateau Spring Cup" }]);
});

test("answers an empty list when nothing is published", async () => {
  expect((await browse("player")).json()).toEqual([]);
});

test.each(["ORGANIZER", "ADMIN"] as const)("lets an %s browse too", async (role) => {
  await createAccount("someone", role);

  expect((await browse("someone")).statusCode).toBe(200);
});

test("asks to log in first", async () => {
  const response = await app.inject({ method: "GET", url: "/tournaments" });

  expect(response.statusCode).toBe(401);
});

// ---------- Organizer routes stay closed to players ----------

test("still turns a player away from the organizer routes", async () => {
  const { id } = await saveTournament(organizerId, "Verdun Winter Cup", {
    startsAt: hoursFromNow(100),
    endsAt: hoursFromNow(110),
  });

  const responses = [
    await call.listMine("player"),
    await call.update("player", id, { name: "Mine now" }),
    await call.addDivision("player", id),
    await call.publish("player", id),
    await call.deleteDraft("player", id),
  ];

  expect(responses.map((response) => response.statusCode)).toEqual([403, 403, 403, 403, 403]);
});
