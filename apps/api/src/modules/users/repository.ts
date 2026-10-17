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

  // Leaves an existing user unchanged, so retrying a sign-up is safe, even when
  // two requests arrive at the same moment (for example, a double tap).
  createIfMissing: async (user: NewUser) => {
    // skipDuplicates lets PostgreSQL ignore the insert if the user already
    // exists ("ON CONFLICT DO NOTHING"), instead of failing with an error.
    await db.user.createMany({ data: [user], skipDuplicates: true });
    return db.user.findUniqueOrThrow({ where: { firebaseUid: user.firebaseUid } });
  },

  // Does nothing if the user is already gone, so retrying a deletion is safe.
  deleteByFirebaseUid: (firebaseUid: string) =>
    db.user.deleteMany({ where: { firebaseUid } }),
});

export type UserRepository = ReturnType<typeof createUserRepository>;
