// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, expect, test } from "vitest";
import { teamNameKey, tidyTeamName } from "../src/modules/teams/rules.ts";
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

const signUp = (uid: string, tournamentId: string, payload: object) =>
  app.inject({
    method: "POST",
    url: `/tournaments/${tournamentId}/teams`,
    headers: authHeader(uid),
    payload,
  });

// Sign-ups are open: they opened 2 hours ago and close in 10 hours.
const openDates = {
  startsAt: hoursFromNow(48),
  endsAt: hoursFromNow(58),
  registrationOpensAt: hoursFromNow(-2),
  registrationClosesAt: hoursFromNow(10),
};

// "Verdun Volley" organizes `cup`, with two divisions: 6v6 Co-ed B / B+ (15
// teams) and 4v4 Women A (8 teams). "lea" and "sam" are players.
let organizerId: string;
let cup: string;
let coed: string;
let women: string;
beforeEach(async () => {
  await testDb.user.deleteMany();
  organizerId = (await createAccount("Verdun Volley")).id;
  await createAccount("lea", "PLAYER");
  await createAccount("sam", "PLAYER");
  const saved = await saveTournament(organizerId, "Verdun Winter Cup", openDates, [coedB, womenA]);
  cup = saved.id;
  const divisions = await testDb.division.findMany({ where: { tournamentId: cup } });
  coed = divisions.find((division) => division.name === coedB.name)!.id;
  women = divisions.find((division) => division.name === womenA.name)!.id;
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

// ---------- Creating a team ----------

test("creates the team with its creator as captain and first player, unpaid", async () => {
  const response = await signUp("lea", cup, { divisionId: coed, name: "Spike Lee" });

  expect(response.statusCode).toBe(201);
  expect(response.json()).toEqual({
    id: expect.any(String),
    name: "Spike Lee",
    divisionId: coed,
    divisionName: coedB.name,
    isCaptain: true,
  });
  const team = await testDb.team.findUniqueOrThrow({
    where: { id: response.json().id },
    include: { members: { include: { user: true } } },
  });
  expect(team).toMatchObject({ tournamentId: cup, paidAt: null });
  expect(team.members.map(({ user, isCaptain }) => [user.firebaseUid, isCaptain])).toEqual([
    ["lea", true],
  ]);
});

test("shows the team on the tournament page, in Search and to the organizer", async () => {
  await signUp("lea", cup, { divisionId: coed, name: "Spike Lee" });

  expect((await call.get("lea", cup)).json()).toMatchObject({
    myTeam: { name: "Spike Lee", divisionId: coed, divisionName: coedB.name, isCaptain: true },
    divisions: [
      { id: coed, registeredTeams: 1 },
      { id: women, registeredTeams: 0 },
    ],
  });
  expect((await call.get("sam", cup)).json()).toMatchObject({ myTeam: null });

  const search = await app.inject({
    method: "GET",
    url: "/tournaments",
    headers: authHeader("sam"),
  });
  expect(
    search
      .json()[0]
      .divisions.map(({ registeredTeams }: { registeredTeams: number }) => registeredTeams),
  ).toEqual([1, 0]);

  expect((await call.get("Verdun Volley", cup)).json()).toMatchObject({ registeredTeams: 1 });
  expect((await call.listMine("Verdun Volley")).json()[0]).toMatchObject({ registeredTeams: 1 });
});

test("tidies the spaces in the name", async () => {
  const response = await signUp("lea", cup, { divisionId: coed, name: "  Spike    Lee " });

  expect(response.json()).toMatchObject({ name: "Spike Lee" });
});

test.each([
  ["any account", "admin", "ADMIN"],
  ["the tournament's own organizer", "Verdun Volley", undefined],
] as const)("lets %s sign up a team", async (_, uid, role) => {
  if (role) await createAccount(uid, role);

  const response = await signUp(uid, cup, { divisionId: coed, name: "Spike Lee" });

  expect(response.statusCode).toBe(201);
});

// ---------- Team names ----------

test.each([
  ["the same name", "Spike Lee"],
  ["a name that differs only in case and spaces", "  spike   LEE "],
])("refuses %s as another team in the tournament", async (_, name) => {
  await signUp("lea", cup, { divisionId: coed, name: "Spike Lee" });

  const response = await signUp("sam", cup, { divisionId: women, name });

  expect(response.statusCode).toBe(409);
  expect(response.json().message).toBe(
    "Another team in this tournament already has that name. Pick another one.",
  );
});

test("allows the same name in another tournament", async () => {
  const other = await saveTournament(organizerId, "Other Cup", openDates);
  const otherDivision = await testDb.division.findFirstOrThrow({
    where: { tournamentId: other.id },
  });
  await signUp("lea", cup, { divisionId: coed, name: "Spike Lee" });

  const response = await signUp("sam", other.id, {
    divisionId: otherDivision.id,
    name: "Spike Lee",
  });

  expect(response.statusCode).toBe(201);
});

// ---------- One team per tournament ----------

test("refuses a second team from a player already on one, in any division", async () => {
  await signUp("lea", cup, { divisionId: coed, name: "Spike Lee" });

  const response = await signUp("lea", cup, { divisionId: women, name: "Net Ninjas" });

  expect(response.statusCode).toBe(409);
  expect(response.json().message).toBe("You're already on a team in this tournament.");
});

test("lets a player be on teams in different tournaments", async () => {
  const other = await saveTournament(organizerId, "Other Cup", openDates);
  const otherDivision = await testDb.division.findFirstOrThrow({
    where: { tournamentId: other.id },
  });
  await signUp("lea", cup, { divisionId: coed, name: "Spike Lee" });

  const response = await signUp("lea", other.id, {
    divisionId: otherDivision.id,
    name: "Net Ninjas",
  });

  expect(response.statusCode).toBe(201);
});

// ---------- Sign-up window and capacity ----------

test.each([
  ["before sign-ups open", 2, 10, "Sign-ups for this tournament haven't opened yet."],
  ["after sign-ups close", -10, -2, "Sign-ups for this tournament are closed."],
])("refuses a team %s", async (_, opensIn, closesIn, message) => {
  const { id } = await saveTournament(organizerId, "Timed Cup", {
    ...openDates,
    registrationOpensAt: hoursFromNow(opensIn),
    registrationClosesAt: hoursFromNow(closesIn),
  });
  const division = await testDb.division.findFirstOrThrow({ where: { tournamentId: id } });

  const response = await signUp("lea", id, { divisionId: division.id, name: "Spike Lee" });

  expect(response.statusCode).toBe(409);
  expect(response.json().message).toBe(message);
});

test("refuses a team in a full division", async () => {
  await testDb.division.update({ where: { id: women }, data: { maxTeams: 2 } });
  await signUp("lea", cup, { divisionId: women, name: "Spike Lee" });
  await signUp("sam", cup, { divisionId: women, name: "Net Ninjas" });
  await createAccount("max", "PLAYER");

  const response = await signUp("max", cup, { divisionId: women, name: "Block Party" });

  expect(response.statusCode).toBe(409);
  expect(response.json().message).toBe("This division is full.");
});

test("gives the last spot to only one of two captains signing up at once", async () => {
  await testDb.division.update({ where: { id: women }, data: { maxTeams: 2 } });
  await signUp("lea", cup, { divisionId: women, name: "Spike Lee" });
  await createAccount("max", "PLAYER");

  const responses = await Promise.all([
    signUp("sam", cup, { divisionId: women, name: "Net Ninjas" }),
    signUp("max", cup, { divisionId: women, name: "Block Party" }),
  ]);

  expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
  expect(await testDb.team.count({ where: { divisionId: women } })).toBe(2);
});

test("gives a name to only one of two teams signing up with it at once", async () => {
  const responses = await Promise.all([
    signUp("lea", cup, { divisionId: coed, name: "Spike Lee" }),
    signUp("sam", cup, { divisionId: women, name: "spike lee" }),
  ]);

  expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
});

test("puts a player on only one team when they send two sign-ups at once", async () => {
  const responses = await Promise.all([
    signUp("lea", cup, { divisionId: coed, name: "Spike Lee" }),
    signUp("lea", cup, { divisionId: women, name: "Net Ninjas" }),
  ]);

  expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
  expect(await testDb.teamMember.count()).toBe(1);
});

// ---------- What doesn't exist or isn't allowed ----------

test("answers not found for a draft, so nobody learns it exists", async () => {
  const draft = await saveTournament(organizerId, "Draft Cup", { ...openDates, status: "DRAFT" });
  const division = await testDb.division.findFirstOrThrow({ where: { tournamentId: draft.id } });

  const response = await signUp("Verdun Volley", draft.id, {
    divisionId: division.id,
    name: "Spike Lee",
  });

  expect(response.statusCode).toBe(404);
  expect(response.json().message).toBe("Tournament not found.");
});

test("answers not found for a tournament that doesn't exist", async () => {
  const response = await signUp("lea", "00000000-0000-4000-8000-000000000000", {
    divisionId: coed,
    name: "Spike Lee",
  });

  expect(response.statusCode).toBe(404);
});

test("answers not found for a division of another tournament", async () => {
  const other = await saveTournament(organizerId, "Other Cup", openDates);
  const otherDivision = await testDb.division.findFirstOrThrow({
    where: { tournamentId: other.id },
  });

  const response = await signUp("lea", cup, { divisionId: otherDivision.id, name: "Spike Lee" });

  expect(response.statusCode).toBe(404);
  expect(response.json().message).toBe("Division not found.");
});

test("asks someone without a Rally account to finish signing up first", async () => {
  const response = await signUp("no-account-yet", cup, { divisionId: coed, name: "Spike Lee" });

  expect(response.statusCode).toBe(404);
  expect(response.json().message).toBe("No Rally account found.");
});

test("asks to log in first", async () => {
  const response = await app.inject({
    method: "POST",
    url: `/tournaments/${cup}/teams`,
    payload: { divisionId: coed, name: "Spike Lee" },
  });

  expect(response.statusCode).toBe(401);
});

test.each([
  ["a blank name", { name: "   " }],
  ["a name over 40 characters", { name: "x".repeat(41) }],
  ["a name on two lines", { name: "Spike\nLee" }],
  ["no division", { divisionId: undefined }],
  ["a division id that isn't one", { divisionId: "coed" }],
  ["an unknown field", { paid: true }],
])("refuses %s", async (_, change) => {
  const response = await signUp("lea", cup, { divisionId: coed, name: "Spike Lee", ...change });

  expect(response.statusCode).toBe(400);
  expect(await testDb.team.count()).toBe(0);
});

// ---------- What the database guarantees ----------

test("keeps a team's division inside the team's tournament", async () => {
  const other = await saveTournament(organizerId, "Other Cup", openDates);

  await expect(
    testDb.team.create({
      data: { tournamentId: other.id, divisionId: coed, name: "Spike Lee", nameKey: "spike lee" },
    }),
  ).rejects.toThrow();
});

test("keeps a member's tournament the same as their team's", async () => {
  const other = await saveTournament(organizerId, "Other Cup", openDates);
  const lea = await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "lea" } });
  const { id } = (await signUp("sam", cup, { divisionId: coed, name: "Spike Lee" })).json();

  await expect(
    testDb.teamMember.create({ data: { teamId: id, tournamentId: other.id, userId: lea.id } }),
  ).rejects.toThrow();
});

test.each([
  ["a blank name", ""],
  ["spaces around it", " Spike Lee"],
  ["over 40 characters", "x".repeat(41)],
])("refuses a stored team name with %s", async (_, name) => {
  await expect(
    testDb.team.create({ data: { tournamentId: cup, divisionId: coed, name, nameKey: name } }),
  ).rejects.toThrow();
});

// ---------- Team name rules ----------

test("compares team names without case or extra spaces", () => {
  expect(tidyTeamName("  Spike \t  Lee ")).toBe("Spike Lee");
  expect(teamNameKey(" Spike  LEE")).toBe(teamNameKey("spike lee"));
  expect(teamNameKey("Équipe Été")).toBe("équipe été");
});
