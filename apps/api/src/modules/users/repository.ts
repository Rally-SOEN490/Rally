// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { Database } from "../../db.ts";

export type NewUser = {
  firebaseUid: string;
  displayName: string;
  ageConfirmedAt: Date;
};

// All database reads and writes for users go through here.
export const createUserRepository = (db: Database) => ({
  findByFirebaseUid: (firebaseUid: string) =>
    db.user.findUnique({ where: { firebaseUid } }),

  // Leaves an existing user unchanged, so retrying a sign-up is safe.
  createIfMissing: (user: NewUser) =>
    db.user.upsert({
      where: { firebaseUid: user.firebaseUid },
      create: user,
      update: {},
    }),

  // Does nothing if the user is already gone, so retrying a deletion is safe.
  deleteByFirebaseUid: (firebaseUid: string) =>
    db.user.deleteMany({ where: { firebaseUid } }),
});

export type UserRepository = ReturnType<typeof createUserRepository>;
