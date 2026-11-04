// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type { AccountRole } from "../../permissions.ts";
import { badgeCatalog } from "../badges/catalog.ts";

export type NewUser = {
  firebaseUid: string;
  displayName: string;
  ageConfirmedAt: Date;
};

export type Language = "EN" | "FR";
export type ColorTheme = "green" | "blue" | "pink";

export type ProfileChanges = {
  displayName?: string;
  profilePhotoKey?: string | null;
  lookingForTeam?: boolean;
  shownBadgeKeys?: string[];
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  thoughtText?: string | null;
  interests?: {
    formats: string[];
    positions: string[];
  };
  notificationsEnabled?: boolean;
  language?: Language;
  colorTheme?: ColorTheme;
  colorBlindMode?: boolean;
  darkMode?: boolean;
};

const normalizeProfileThoughtText = (thoughtText: string | null | undefined) => {
  if (thoughtText === null || thoughtText === undefined) return thoughtText;
  const trimmed = thoughtText.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const autoAwardedBadgeKeys = badgeCatalog
  .filter((badge) => badge.autoAward)
  .map((badge) => badge.key);

// All database reads and writes for users go through here.
export const createUserRepository = (db: Database) => {
  const includeBadges = {
    interests: true,
    badges: {
      orderBy: [{ receivedCount: "desc" as const }, { badgeType: { key: "asc" as const } }],
      include: { badgeType: true },
    },
  };

  const assignAutoAwardedBadges = async (userId: string) => {
    for (const badge of badgeCatalog) {
      await db.badgeType.upsert({
        where: { key: badge.key },
        update: {
          name: badge.name,
          tier: badge.tier,
          description: badge.description,
          imageUrl: badge.image,
          autoAward: badge.autoAward,
        },
        create: {
          key: badge.key,
          name: badge.name,
          tier: badge.tier,
          description: badge.description,
          imageUrl: badge.image,
          autoAward: badge.autoAward,
        },
      });
    }

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
    findAllExceptFirebaseUid: (firebaseUid: string) =>
      db.user.findMany({
        where: { firebaseUid: { not: firebaseUid } },
        orderBy: [{ displayName: "asc" }, { id: "asc" }],
        include: includeBadges,
      }),
    // Used by requirePermission. Reads only the role, so permission checks stay cheap.
    findRoleByFirebaseUid: async (firebaseUid: string): Promise<AccountRole | null> => {
      const user = await db.user.findUnique({ where: { firebaseUid }, select: { role: true } });
      return user?.role ?? null;
    },

    // What the organizer applications module needs to know about an applicant.
    findApplicant: (firebaseUid: string) =>
      db.user.findUnique({
        where: { firebaseUid },
        select: { id: true, displayName: true, role: true },
      }),

    // Makes a player an organizer, inside the caller's transaction. Leaves an
    // admin (or someone already an organizer) as they are.
    promoteToOrganizer: (userId: string, transaction: Prisma.TransactionClient) =>
      transaction.user.updateMany({
        where: { id: userId, role: "PLAYER" },
        data: { role: "ORGANIZER" },
      }),

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
      const savedUser = await db.user.findUniqueOrThrow({
        where: { firebaseUid: user.firebaseUid },
      });
      await assignAutoAwardedBadges(savedUser.id);
      return db.user.findUniqueOrThrow({
        where: { id: savedUser.id },
        include: includeBadges,
      });
    },

    updateByFirebaseUid: async (firebaseUid: string, changes: ProfileChanges) => {
      const normalizedChanges = {
        ...changes,
        ...(changes.displayName !== undefined ? { displayName: changes.displayName.trim() } : {}),
        ...(changes.thoughtText !== undefined
          ? { thoughtText: normalizeProfileThoughtText(changes.thoughtText) }
          : {}),
      };

      const { interests, ...userChanges } = normalizedChanges;
      const user = await db.user.findUnique({ where: { firebaseUid }, select: { id: true } });
      if (!user) return null;
      const updatedUser = await db.$transaction(async (transaction) => {
        await transaction.user.update({ where: { id: user.id }, data: userChanges });
        if (interests) {
          await transaction.userInterest.deleteMany({ where: { userId: user.id } });
          await transaction.userInterest.createMany({
            data: [
              ...interests.formats.map((key) => ({ userId: user.id, category: "format", key })),
              ...interests.positions.map((key) => ({ userId: user.id, category: "position", key })),
            ],
          });
        }
        return transaction.user.findUnique({ where: { id: user.id }, include: includeBadges });
      });
      return updatedUser;
    },

    // Does nothing if the user is already gone, so retrying a deletion is safe.
    deleteByFirebaseUid: (firebaseUid: string) => db.user.deleteMany({ where: { firebaseUid } }),
  };
};

export type UserRepository = ReturnType<typeof createUserRepository>;
