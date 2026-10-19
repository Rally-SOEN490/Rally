// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { Database } from "../../db.ts";
import { badgeCatalog } from "../badges/catalog.ts";

export type NewUser = {
  firebaseUid: string;
  displayName: string;
  ageConfirmedAt: Date;
};

const autoAwardedBadgeKeys = badgeCatalog
  .filter((badge) => badge.autoAward)
  .map((badge) => badge.key);

// All database reads and writes for users go through here.
export const createUserRepository = (db: Database) => {
  const includeBadges = {
    badges: {
      orderBy: [
        { receivedCount: "desc" as const },
        { badgeType: { key: "asc" as const } },
      ],
      include: { badgeType: true },
    },
  };

  const assignAutoAwardedBadges = async (userId: string) => {
    const defaultBadges = await db.badgeType.findMany({
      where: { key: { in: autoAwardedBadgeKeys } },
      select: { id: true },
    });
    await db.userBadge.createMany({
      data: defaultBadges.map(({ id: badgeTypeId }) => ({
        userId,
        badgeTypeId,
        receivedCount: 1,
      })),
      skipDuplicates: true,
    });
  };

  return {
    findByFirebaseUid: async (firebaseUid: string) => {
      const user = await db.user.findUnique({ where: { firebaseUid } });
      if (!user) return null;
      await assignAutoAwardedBadges(user.id);
      return db.user.findUnique({
        where: { id: user.id },
        include: includeBadges,
      });
    },

    // Leaves an existing user unchanged, so retrying a sign-up is safe, even when
    // two requests arrive at the same moment (for example, a double tap).
    createIfMissing: async (user: NewUser) => {
      // skipDuplicates lets PostgreSQL ignore the insert if the user already
      // exists ("ON CONFLICT DO NOTHING"), instead of failing with an error.
      await db.user.createMany({ data: [user], skipDuplicates: true });
      const savedUser = await db.user.findUniqueOrThrow({ where: { firebaseUid: user.firebaseUid } });
      await assignAutoAwardedBadges(savedUser.id);
      return db.user.findUniqueOrThrow({
        where: { id: savedUser.id },
        include: includeBadges,
      });
    },

    // Does nothing if the user is already gone, so retrying a deletion is safe.
    deleteByFirebaseUid: (firebaseUid: string) =>
      db.user.deleteMany({ where: { firebaseUid } }),
  };
};

export type UserRepository = ReturnType<typeof createUserRepository>;
