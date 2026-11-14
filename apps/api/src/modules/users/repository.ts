// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type { SkillLevel } from "./preferences.ts";
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
  skillLevel?: SkillLevel | null;
  profilePhotoKey?: string | null;
  lookingForTeam?: boolean;
  shownBadgeKeys?: string[];
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  thoughtText?: string | null;
  interests?: {
    formats: string[];
    positions: string[];
    clubs?: string[];
    other?: string[];
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

// The user's interests and badges, in the order the API shows them.
const includeBadges = {
  interests: { orderBy: [{ category: "asc" as const }, { key: "asc" as const }] },
  badges: {
    orderBy: [{ receivedCount: "desc" as const }, { badgeType: { key: "asc" as const } }],
    include: { badgeType: true },
  },
};

// Trims the display name and the thought text. An empty thought text is stored as null.
const normalizeProfileChanges = (changes: ProfileChanges) => ({
  ...changes,
  ...(changes.displayName !== undefined ? { displayName: changes.displayName.trim() } : {}),
  ...(changes.thoughtText !== undefined
    ? { thoughtText: normalizeProfileThoughtText(changes.thoughtText) }
    : {}),
});

// One database row per interest, tagged with its category.
const toInterestRows = (userId: string, interests: NonNullable<ProfileChanges["interests"]>) => [
  ...interests.formats.map((key) => ({ userId, category: "format", key })),
  ...interests.positions.map((key) => ({ userId, category: "position", key })),
  ...(interests.clubs ?? []).map((key) => ({ userId, category: "club", key })),
  ...(interests.other ?? []).map((key) => ({ userId, category: "other", key })),
];

// Keeps the badge types in the database in step with the badge catalog.
const syncBadgeTypes = async (db: Database) => {
  for (const badge of badgeCatalog) {
    const fields = {
      name: badge.name,
      tier: badge.tier,
      description: badge.description,
      imageUrl: badge.image,
      autoAward: badge.autoAward,
    };
    await db.badgeType.upsert({
      where: { key: badge.key },
      update: fields,
      create: { key: badge.key, ...fields },
    });
  }
};

// Gives the user every badge everyone starts with. Safe to repeat.
const assignAutoAwardedBadges = async (db: Database, userId: string) => {
  await syncBadgeTypes(db);
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

// Deletes the account in one transaction, after `beforeDelete` removes what
// other modules keep about it. Does nothing if the user is already gone, so
// retrying a deletion is safe.
const deleteAccount = (
  db: Database,
  firebaseUid: string,
  beforeDelete: (userId: string, transaction: Prisma.TransactionClient) => Promise<void>,
) =>
  db.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });
    if (!user) return;
    await beforeDelete(user.id, transaction);
    await transaction.user.deleteMany({ where: { id: user.id } });
  });

// Saves the changes and replaces the interests in one transaction. Returns null
// when the person has no Rally account.
const updateProfile = (db: Database, firebaseUid: string, changes: ProfileChanges) => {
  const { interests, ...userChanges } = normalizeProfileChanges(changes);
  return db.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });
    if (!user) return null;
    await transaction.user.update({ where: { id: user.id }, data: userChanges });
    if (interests) {
      await transaction.userInterest.deleteMany({ where: { userId: user.id } });
      await transaction.userInterest.createMany({ data: toInterestRows(user.id, interests) });
    }
    return transaction.user.findUnique({ where: { id: user.id }, include: includeBadges });
  });
};

// All database reads and writes for users go through here.
export const createUserRepository = (db: Database) => ({
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

  // Who a logged-in person is, for modules that need their ID and role
  // (organizer applications, tournaments) without reading the users table.
  findAccount: (firebaseUid: string) =>
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
    await assignAutoAwardedBadges(db, user.id);
    return db.user.findUnique({ where: { id: user.id }, include: includeBadges });
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
    await assignAutoAwardedBadges(db, savedUser.id);
    return db.user.findUniqueOrThrow({ where: { id: savedUser.id }, include: includeBadges });
  },

  updateByFirebaseUid: (firebaseUid: string, changes: ProfileChanges) =>
    updateProfile(db, firebaseUid, changes),

  deleteByFirebaseUid: (firebaseUid: string, beforeDelete: Parameters<typeof deleteAccount>[2]) =>
    deleteAccount(db, firebaseUid, beforeDelete),
});

export type UserRepository = ReturnType<typeof createUserRepository>;
