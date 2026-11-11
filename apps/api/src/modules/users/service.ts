// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { ColorTheme, Language, ProfileChanges, UserRepository } from "./repository.ts";
import { badgeCatalog, getBadgeCompletion, getBadgeTier } from "../badges/catalog.ts";
import type { ProfilePhotoStorage } from "./photo-storage.ts";
import type { AccountRole } from "../../permissions.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

// What this module needs from the teams module, passed in by app.ts.
export type AccountTeams = {
  leaveAllTeams: (userId: string, transaction: Prisma.TransactionClient) => Promise<void>;
};

// What the API sends back about a user. Internal fields like firebaseUid stay on the server.
export type UserResponse = {
  id: string;
  displayName: string;
  // Only sent to the person themselves, so the app can show organizer tools.
  // The server still checks the role on every restricted request.
  role: AccountRole;
  profilePhotoUrl: string | null;
  lookingForTeam: boolean;
  shownBadgeKeys: string[];
  instagramUrl: string | null;
  facebookUrl: string | null;
  thoughtText: string | null;
  interests: {
    formats: string[];
    positions: string[];
    clubs: string[];
    other: string[];
  };
  // App settings. Only sent to the person themselves (the directory leaves them out).
  notificationsEnabled: boolean;
  language: Language;
  colorTheme: ColorTheme;
  colorBlindMode: boolean;
  darkMode: boolean;
  createdAt: string;
  badges: Array<{
    key: string;
    name: string;
    tier: string;
    description: string;
    imageUrl: string | null;
    image: string;
    availableTiers: string[];
    isComplete: boolean;
    nextTierThreshold: number | null;
    receivedCount: number;
    awardedAt: string;
  }>;
};

export type UserDirectoryResponse = Pick<
  UserResponse,
  "id" | "displayName" | "lookingForTeam" | "createdAt" | "badges"
>;

type UserWithBadges = NonNullable<Awaited<ReturnType<UserRepository["findByFirebaseUid"]>>>;

// Turns one of the user's badges into what the API sends back.
const toBadgeResponse = ({
  badgeType,
  receivedCount,
  awardedAt,
}: UserWithBadges["badges"][number]): UserResponse["badges"][number] => {
  const definition = badgeCatalog.find((badge) => badge.key === badgeType.key);
  const availableTiers = definition?.availableTiers ?? ["Bronze"];
  const tierThresholds = definition?.tierThresholds ?? { Bronze: 0 };
  const tier = getBadgeTier(badgeType.tier, receivedCount, availableTiers, tierThresholds);
  const completion = getBadgeCompletion(
    badgeType.tier as "Bronze" | "Silver" | "Gold",
    tier,
    availableTiers,
    tierThresholds,
    receivedCount,
  );

  return {
    key: badgeType.key,
    name: badgeType.name,
    tier,
    description: badgeType.description,
    imageUrl: badgeType.imageUrl,
    image: badgeType.imageUrl ?? "badge-gold-placeholder",
    availableTiers: [...availableTiers],
    ...completion,
    receivedCount,
    awardedAt: awardedAt.toISOString(),
  };
};

// The keys of the user's interests in one category, for example "format".
const interestKeysIn = (user: UserWithBadges, category: string) =>
  user.interests.filter((interest) => interest.category === category).map(({ key }) => key);

// Most-received badges first, then alphabetical by key.
const byBadgeOrder = (
  left: UserWithBadges["badges"][number],
  right: UserWithBadges["badges"][number],
) =>
  right.receivedCount - left.receivedCount || left.badgeType.key.localeCompare(right.badgeType.key);

const toResponse = async (
  user: UserWithBadges,
  photos?: ProfilePhotoStorage,
): Promise<UserResponse> => ({
  id: user.id,
  displayName: user.displayName,
  role: user.role,
  profilePhotoUrl:
    user.profilePhotoKey && photos ? await photos.getUrl(user.profilePhotoKey) : null,
  lookingForTeam: user.lookingForTeam,
  shownBadgeKeys: [...user.shownBadgeKeys],
  instagramUrl: user.instagramUrl,
  facebookUrl: user.facebookUrl,
  thoughtText: user.thoughtText,
  interests: {
    formats: interestKeysIn(user, "format"),
    positions: interestKeysIn(user, "position"),
    clubs: interestKeysIn(user, "club"),
    other: interestKeysIn(user, "other"),
  },
  notificationsEnabled: user.notificationsEnabled,
  // The route only stores the allowed values, so these casts are safe.
  language: user.language as Language,
  colorTheme: user.colorTheme as ColorTheme,
  colorBlindMode: user.colorBlindMode,
  darkMode: user.darkMode,
  createdAt: user.createdAt.toISOString(),
  badges: [...user.badges].sort(byBadgeOrder).map(toBadgeResponse),
});

const toDirectoryResponse = async (user: UserWithBadges): Promise<UserDirectoryResponse> => {
  const response = await toResponse(user);
  return {
    id: response.id,
    displayName: response.displayName,
    lookingForTeam: response.lookingForTeam,
    createdAt: response.createdAt,
    badges: response.badges,
  };
};

type UserServiceDependencies = { users: UserRepository; photos?: ProfilePhotoStorage };

// Reads the user fresh from the database and converts them for the API.
const findResponse = async ({ users, photos }: UserServiceDependencies, firebaseUid: string) => {
  const user = await users.findByFirebaseUid(firebaseUid);
  return user ? toResponse(user, photos) : null;
};

const requirePhotos = (photos?: ProfilePhotoStorage) => {
  if (!photos) throw new Error("Profile photo uploads are not configured.");
  return photos;
};

export const createUserService = (
  users: UserRepository,
  teams: AccountTeams,
  photos?: ProfilePhotoStorage,
) => {
  const dependencies = { users, photos };

  return {
    getDirectory: async (firebaseUid: string) =>
      Promise.all((await users.findAllExceptFirebaseUid(firebaseUid)).map(toDirectoryResponse)),

    // The route only accepts the request if the person confirmed their age.
    register: async (firebaseUid: string, displayName: string) =>
      toResponse(
        await users.createIfMissing({
          firebaseUid,
          displayName: displayName.trim(),
          ageConfirmedAt: new Date(),
        }),
        photos,
      ),

    getCurrent: (firebaseUid: string) => findResponse(dependencies, firebaseUid),

    uploadPhoto: async (firebaseUid: string, body: Buffer) => {
      const storage = requirePhotos(photos);
      const existing = await users.findByFirebaseUid(firebaseUid);
      if (!existing) return null;
      const key = await storage.put(firebaseUid, body);
      await users.updateByFirebaseUid(firebaseUid, { profilePhotoKey: key });
      if (existing.profilePhotoKey && existing.profilePhotoKey !== key)
        await storage.delete(existing.profilePhotoKey).catch(() => undefined);
      return findResponse(dependencies, firebaseUid);
    },

    removePhoto: async (firebaseUid: string) => {
      const storage = requirePhotos(photos);
      const existing = await users.findByFirebaseUid(firebaseUid);
      if (!existing) return null;
      if (existing.profilePhotoKey) await storage.delete(existing.profilePhotoKey);
      await users.updateByFirebaseUid(firebaseUid, { profilePhotoKey: null });
      return findResponse(dependencies, firebaseUid);
    },

    update: async (firebaseUid: string, changes: ProfileChanges) => {
      const user = await users.updateByFirebaseUid(firebaseUid, {
        ...changes,
        ...(changes.displayName !== undefined ? { displayName: changes.displayName.trim() } : {}),
      });
      return user ? toResponse(user, photos) : null;
    },

    // Removes everything Rally stores about the person, and any team left with no
    // players, which would otherwise keep its spot and name (docs/architecture/teams.md).
    // Once teams have results, this must keep match history but replace their
    // name with "Deleted player" (see the architecture page on the Wiki).
    remove: (firebaseUid: string) => users.deleteByFirebaseUid(firebaseUid, teams.leaveAllTeams),
  };
};
