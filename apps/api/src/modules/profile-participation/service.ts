// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { ParticipationRepository } from "./repository.ts";

export type RegistrationSnapshot = {
  userId: string; registrationId: string; eventName: string; tournamentName: string;
  teamName: string; format: string; startsAt: Date; endsAt: Date;
  state: "CONFIRMED" | "CANCELLED";
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const createParticipationService = (rows: ParticipationRepository) => ({
  upcoming: async (uid: string, now = new Date()) => {
    const owner = await rows.findOwner(uid);
    if (!owner) throw Object.assign(new Error("No Rally account found."), { statusCode: 404 });
    return { tournaments: (await rows.upcoming(owner.id, now)).map((entry) => ({
      id: entry.registrationId, eventName: entry.eventName, tournamentName: entry.tournamentName,
      teamName: entry.teamName, format: entry.format, startsAt: entry.startsAt.toISOString(),
    })) };
  },
  history: async (uid: string, now = new Date()) => {
    const owner = await rows.findOwner(uid);
    if (!owner) throw Object.assign(new Error("No Rally account found."), { statusCode: 404 });
    return { results: (await rows.history(owner.id, now)).map((entry) => ({
      id: entry.registrationId, eventName: entry.eventName, tournamentName: entry.tournamentName,
      teamName: entry.teamName, endedAt: entry.endsAt.toISOString(), placement: entry.placement!,
    })) };
  },
  // Only a trusted results producer may publish or correct a final placement.
  finalizeResult: async (userId: string, registrationId: string, placement: number, now = new Date()) => {
    if (!uuid.test(userId) || !uuid.test(registrationId) || !Number.isInteger(placement) || placement < 1 || placement > 2147483647 || !Number.isFinite(now.getTime())) {
      throw new Error("Invalid finalized result.");
    }
    const result = await rows.finalizeResult(userId, registrationId, placement, now);
    if (result.count !== 1) throw new Error("No eligible completed participation found.");
  },
  // Called by trusted registration code in its transaction, never by a player HTTP route.
  syncRegistration: async (snapshot: RegistrationSnapshot) => {
    if (!uuid.test(snapshot.userId) || !uuid.test(snapshot.registrationId) ||
        !["CONFIRMED", "CANCELLED"].includes(snapshot.state) ||
        !Number.isFinite(snapshot.startsAt.getTime()) || !Number.isFinite(snapshot.endsAt.getTime()) ||
        snapshot.endsAt <= snapshot.startsAt ||
        [snapshot.eventName, snapshot.tournamentName, snapshot.teamName].some((name) => !name.trim() || Array.from(name).length > 140 || /\p{Cc}/u.test(name)) ||
        !snapshot.format.trim() || Array.from(snapshot.format).length > 100 || /\p{Cc}/u.test(snapshot.format)) {
      throw new Error("Invalid registration snapshot.");
    }
    await rows.syncRegistration(snapshot);
    await rows.updateRegistration(snapshot);
  },
});
