// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

// Disposable accounts in demo-rally and rally_e2e only. Never uses team Firebase.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { connectDatabase } from "../src/db.ts";
import { createParticipationRepository } from "../src/modules/profile-participation/repository.ts";
import { createParticipationService } from "../src/modules/profile-participation/service.ts";

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const auth = getAuth(initializeApp({ projectId: "demo-rally" }, "profile-fixtures"));
const db = connectDatabase("postgresql://rally:rally@127.0.0.1:5432/rally_e2e");
const password = "RallyLocalOnly123!";
const accounts = [
  { uid: "profile-e2e-owner", email: "profile-owner@example.test", displayName: "Sam Lee" },
  { uid: "profile-e2e-viewer", email: "profile-viewer@example.test", displayName: "Alex Chen" },
];
const now = new Date();
const when = (days, hours = 10) => {
  const value = new Date(now); value.setUTCDate(value.getUTCDate() + days); value.setUTCHours(hours, 0, 0, 0); return value;
};
try {
  for (const account of accounts) {
    try { await auth.createUser({ ...account, password, emailVerified: true }); }
    catch (reason) {
      if (reason.code !== "auth/uid-already-exists") throw reason;
      const existing = await auth.getUser(account.uid);
      if (existing.email !== account.email) throw new Error("Unexpected account at the fixture UID.");
      if (!existing.emailVerified) await auth.updateUser(account.uid, { emailVerified: true });
    }
    await db.user.upsert({ where: { firebaseUid: account.uid }, update: {}, create: {
      firebaseUid: account.uid, displayName: account.displayName, ageConfirmedAt: now,
    } });
  }
  const owner = await db.user.findUniqueOrThrow({ where: { firebaseUid: accounts[0].uid } });
  await db.profileParticipation.deleteMany({ where: { userId: owner.id } });
  const message = process.argv.includes("--empty") ? "" : "Weekend volleyball, good rallies and great teammates. 🏐";
  await db.profileMessage.upsert({ where: { userId: owner.id }, create: { userId: owner.id, text: message }, update: { text: message } });
  if (!process.argv.includes("--empty")) {
    const profiles = createParticipationService(createParticipationRepository(db));
    for (let index = 1; index <= 3; index++) {
      await profiles.syncRegistration({ userId: owner.id, registrationId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        eventName: ["Autumn Rally", "Beach Weekend", "Winter Open"][index - 1],
        tournamentName: ["Mixed 6s", "Beach 2s", "Indoor 6s"][index - 1], teamName: ["Sunbirds", "Sandstorm", "North Stars"][index - 1],
        format: index === 2 ? "Beach 2s" : "Indoor 6s", startsAt: when(index * 7), endsAt: when(index * 7, 18), state: "CONFIRMED",
      });
    }
    for (let index = 1; index <= 5; index++) {
      const registrationId = `00000000-0000-4000-9000-${String(index).padStart(12, "0")}`;
      await profiles.syncRegistration({ userId: owner.id, registrationId,
        eventName: ["Summer Rally", "City Series", "Spring Open", "Winter Cup", "Regional Rally"][index - 1],
        tournamentName: index % 2 ? "Mixed 6s" : "Beach 2s", teamName: index % 2 ? "Sunbirds" : "Sandstorm",
        format: index % 2 ? "Indoor 6s" : "Beach 2s", startsAt: when(-index * 20), endsAt: when(-index * 20, 18), state: "CONFIRMED",
      });
      await profiles.finalizeResult(owner.id, registrationId, index, now);
    }
  }
  console.log("Disposable profile fixtures ready in demo-rally / rally_e2e.");
  console.log("Owner: profile-owner@example.test; empty comparison account: profile-viewer@example.test");
} finally { await db.$disconnect(); }
