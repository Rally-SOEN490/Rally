// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { buildApp } from "../src/app.ts";
import type { Prisma } from "../src/generated/prisma/client.ts";
import { authHeader, testDb } from "./helpers.ts";
import { fakeVerifyIdToken } from "./organizer-helpers.ts";

export const buildTournamentTestApp = () =>
  buildApp({ db: testDb, verifyIdToken: fakeVerifyIdToken, corsOrigins: [] });

type App = Awaited<ReturnType<typeof buildTournamentTestApp>>;

export const createAccount = (uid: string, role: "PLAYER" | "ORGANIZER" | "ADMIN" = "ORGANIZER") =>
  testDb.user.create({
    data: { firebaseUid: uid, displayName: uid, ageConfirmedAt: new Date(), role },
  });

// Everything a tournament needs before it can be published, in Montreal time.
export const completeSetup = {
  location: "Verdun Auditorium, 4110 Bd LaSalle",
  courts: 3,
  description: "🏐 Our biggest indoor tourney!\n\n  • 3 pool games\n  • Playoffs",
  startsAt: "2027-11-15T09:00",
  endsAt: "2027-11-15T19:00",
  registrationOpensAt: "2027-10-20T12:00",
  registrationClosesAt: "2027-11-09T23:59",
};

export const sampleDivision = {
  name: "6v6 Co-ed B",
  format: "6v6",
  type: "coed",
  levels: ["B", "B+"],
  maxTeams: 15,
  priceCents: 24000,
};

// Small wrappers so tests read like what the organizer does.
export const tournamentCalls = (app: App) => {
  const send = (
    method: "GET" | "POST" | "PATCH" | "DELETE",
    uid: string,
    url: string,
    payload?: object,
  ) => app.inject({ method, url, headers: authHeader(uid), ...(payload && { payload }) });
  return {
    create: (uid: string, payload: object = { name: "Verdun Winter Cup" }) =>
      send("POST", uid, "/tournaments", payload),
    listMine: (uid: string) => send("GET", uid, "/tournaments/mine"),
    get: (uid: string, id: string) => send("GET", uid, `/tournaments/${id}`),
    update: (uid: string, id: string, payload: object) =>
      send("PATCH", uid, `/tournaments/${id}`, payload),
    addDivision: (uid: string, id: string, payload: object = sampleDivision) =>
      send("POST", uid, `/tournaments/${id}/divisions`, payload),
    updateDivision: (uid: string, id: string, divisionId: string, payload: object) =>
      send("PATCH", uid, `/tournaments/${id}/divisions/${divisionId}`, payload),
    removeDivision: (uid: string, id: string, divisionId: string) =>
      send("DELETE", uid, `/tournaments/${id}/divisions/${divisionId}`),
    publish: (uid: string, id: string) => send("POST", uid, `/tournaments/${id}/publish`),
    deleteDraft: (uid: string, id: string) => send("DELETE", uid, `/tournaments/${id}`),
  };
};

// ---------- Tournaments written straight to the database ----------

export const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);

const days = (count: number) => count * 24 * 60 * 60 * 1000;

// Divisions as the database stores them.
export const coedB: Prisma.DivisionCreateWithoutTournamentInput = {
  name: "6v6 Co-ed B / B+",
  format: "SIX_V_SIX",
  type: "COED",
  levels: ["B_PLUS", "B"],
  maxTeams: 15,
  priceCents: 24000,
};
export const womenA: Prisma.DivisionCreateWithoutTournamentInput = {
  name: "4v4 Women A",
  format: "FOUR_V_FOUR",
  type: "WOMEN",
  levels: ["A"],
  maxTeams: 8,
  priceCents: 12050,
};

// Writes a tournament straight to the database, so tests can set any status and
// dates, including ones the API wouldn't let an organizer publish. Registration
// opens 30 days before the start and closes a day before, unless given.
export const saveTournament = (
  organizerId: string,
  name: string,
  fields: {
    startsAt: Date;
    endsAt: Date;
    status?: "DRAFT" | "PUBLISHED";
    registrationOpensAt?: Date;
    registrationClosesAt?: Date;
  },
  divisions: Prisma.DivisionCreateWithoutTournamentInput[] = [coedB],
) => {
  const { startsAt, status = "PUBLISHED" } = fields;
  return testDb.tournament.create({
    data: {
      location: "Verdun Auditorium",
      courts: 3,
      description: "🏐 The best 6s day of the year!\n\n  • 3 pool games",
      registrationOpensAt: new Date(startsAt.getTime() - days(30)),
      registrationClosesAt: new Date(startsAt.getTime() - days(1)),
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      ...fields,
      status,
      organizerId,
      name,
      divisions: { create: divisions },
    },
  });
};
