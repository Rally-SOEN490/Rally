// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { buildApp } from "../src/app.ts";
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
