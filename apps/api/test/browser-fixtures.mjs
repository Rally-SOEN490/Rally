// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

// Disposable local fixtures only: demo Firebase, localhost API and rally_e2e.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { connectDatabase } = await import("../src/db.ts");
const auth = getAuth(
  initializeApp({ projectId: "demo-rally" }, "profile-browser-tests"),
);
const db = connectDatabase("postgresql://rally:rally@localhost:5432/rally_e2e");
const password = "RallyLocalOnly123!";
const accounts = [
  {
    uid: "profile-e2e-owner",
    email: "profile-owner@example.test",
    displayName: "Sam Lee",
  },
  {
    uid: "profile-e2e-viewer",
    email: "profile-viewer@example.test",
    displayName: "Alex Chen",
  },
];
try {
  for (const account of accounts) {
    const data = { ...account, password, emailVerified: true };
    try {
      await auth.createUser(data);
    } catch (e) {
      if (e.code !== "auth/uid-already-exists") throw e;
      await auth.updateUser(account.uid, data);
    }
    const login = await fetch(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password,
          returnSecureToken: true,
        }),
      },
    ).then((r) => r.json());
    if (!login.idToken) throw new Error("Local emulator sign-in failed.");
    const saved = await fetch("http://localhost:3001/users/me", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${login.idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: account.displayName,
        ageConfirmed: true,
      }),
    });
    if (!saved.ok)
      throw new Error(`Test account registration failed: ${saved.status}`);
  }
  const owner = await db.user.findUniqueOrThrow({
    where: { firebaseUid: "profile-e2e-owner" },
  });
  const details = {
    bio: "Weekend volleyball, good rallies and great teammates.",
    statusMessage: "Private status for tests",
    interests: ["Indoor 6s", "Beach 2s"],
  };
  await db.playerProfile.upsert({
    where: { userId: owner.id },
    create: { userId: owner.id, ...details },
    update: details,
  });
  const privacy = {
    profileVisible: true,
    showBio: true,
    showInterests: true,
    showPhoto: false,
    showStatus: false,
    showSocialLinks: false,
    showBadges: false,
    showMemberSince: false,
  };
  await db.profilePrivacy.upsert({
    where: { userId: owner.id },
    create: { userId: owner.id, ...privacy },
    update: privacy,
  });
  const viewer = await db.user.findUniqueOrThrow({
    where: { firebaseUid: "profile-e2e-viewer" },
  });
  console.log(
    JSON.stringify({
      ownerProfileId: owner.id,
      viewerProfileId: viewer.id,
      url: `http://localhost:8082/players/${owner.id}`,
    }),
  );
} finally {
  await db.$disconnect();
}
