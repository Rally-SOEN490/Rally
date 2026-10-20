// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { Database } from "../../db.ts";
import type { RegistrationSnapshot } from "./service.ts";

type ParticipationDatabase = Pick<Database, "user" | "profileParticipation">;
export const createParticipationRepository = (db: ParticipationDatabase) => ({
  findOwner: (firebaseUid: string) => db.user.findUnique({ where: { firebaseUid }, select: { id: true } }),
  upcoming: (userId: string, now: Date) => db.profileParticipation.findMany({
    where: { userId, state: "CONFIRMED", startsAt: { gt: now } },
    orderBy: [{ startsAt: "asc" }, { registrationId: "asc" }],
  }),
  syncRegistration: (snapshot: RegistrationSnapshot) => db.profileParticipation.upsert({
    where: { userId_registrationId: { userId: snapshot.userId, registrationId: snapshot.registrationId } },
    create: snapshot,
    // A late registration update must never rewrite finalized historical team names.
    update: {},
  }),
  updateRegistration: (snapshot: RegistrationSnapshot) => db.profileParticipation.updateMany({
    where: { userId: snapshot.userId, registrationId: snapshot.registrationId, state: { not: "COMPLETED" } },
    data: snapshot,
  }),
});
export type ParticipationRepository = ReturnType<typeof createParticipationRepository>;
