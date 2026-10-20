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
