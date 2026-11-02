// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { ColorTheme, Language, ProfileChanges, UserRepository } from "./repository.ts";
import { badgeCatalog, getBadgeCompletion, getBadgeTier } from "../badges/catalog.ts";
import type { ProfilePhotoStorage } from "./photo-storage.ts";

// What the API sends back about a user. Internal fields like firebaseUid stay on the server.
export type UserResponse = {
  id: string;
  displayName: string;
  profilePhotoUrl: string | null;
  lookingForTeam: boolean;
  shownBadgeKeys: string[];
  instagramUrl: string | null;
  facebookUrl: string | null;
  thoughtText: string | null;
  interests: {
    formats: string[];
    positions: string[];
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

export type Gender = "male" | "female";

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

const toResponse = async (
  user: UserWithBadges,
  photos?: ProfilePhotoStorage,
): Promise<UserResponse> => ({
  id: user.id,
  displayName: user.displayName,
  profilePhotoUrl:
    user.profilePhotoKey && photos ? await photos.getUrl(user.profilePhotoKey) : null,
  lookingForTeam: user.lookingForTeam,
  shownBadgeKeys: [...user.shownBadgeKeys],
  instagramUrl: user.instagramUrl,
  facebookUrl: user.facebookUrl,
  thoughtText: user.thoughtText,
  interests: {
    formats: user.interests.filter(({ category }) => category === "format").map(({ key }) => key),
    positions: user.interests
      .filter(({ category }) => category === "position")
      .map(({ key }) => key),
  },
  notificationsEnabled: user.notificationsEnabled,
  // The route only stores the allowed values, so these casts are safe.
  language: user.language as Language,
  colorTheme: user.colorTheme as ColorTheme,
  colorBlindMode: user.colorBlindMode,
  darkMode: user.darkMode,
  createdAt: user.createdAt.toISOString(),
  badges: [...user.badges]
    .sort(
      (left, right) =>
        right.receivedCount - left.receivedCount ||
        left.badgeType.key.localeCompare(right.badgeType.key),
    )
    .map(toBadgeResponse),
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

export const createUserService = (users: UserRepository, photos?: ProfilePhotoStorage) => ({
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

  getCurrent: async (firebaseUid: string) => {
    const user = await users.findByFirebaseUid(firebaseUid);
    return user ? toResponse(user, photos) : null;
  },

  updateCurrent: async (firebaseUid: string, displayName: string) => {
    const existing = await users.findByFirebaseUid(firebaseUid);
    if (!existing) return null;
    await users.updateByFirebaseUid(firebaseUid, {
      displayName: displayName.trim(),
    });
    const user = await users.findByFirebaseUid(firebaseUid);
    return user ? toResponse(user, photos) : null;
  },

  uploadPhoto: async (firebaseUid: string, body: Buffer) => {
    if (!photos) throw new Error("Profile photo uploads are not configured.");
    const existing = await users.findByFirebaseUid(firebaseUid);
    if (!existing) return null;
    const key = await photos.put(firebaseUid, body);
    await users.updateByFirebaseUid(firebaseUid, { profilePhotoKey: key });
    if (existing.profilePhotoKey && existing.profilePhotoKey !== key)
      await photos.delete(existing.profilePhotoKey).catch(() => undefined);
    const updated = await users.findByFirebaseUid(firebaseUid);
    return updated ? toResponse(updated, photos) : null;
  },

  removePhoto: async (firebaseUid: string) => {
    if (!photos) throw new Error("Profile photo uploads are not configured.");
    const existing = await users.findByFirebaseUid(firebaseUid);
    if (!existing) return null;
    if (existing.profilePhotoKey) await photos.delete(existing.profilePhotoKey);
    await users.updateByFirebaseUid(firebaseUid, { profilePhotoKey: null });
    const updated = await users.findByFirebaseUid(firebaseUid);
    return updated ? toResponse(updated, photos) : null;
  },

  update: async (firebaseUid: string, changes: ProfileChanges) => {
    const user = await users.updateByFirebaseUid(firebaseUid, {
      ...changes,
      ...(changes.displayName !== undefined ? { displayName: changes.displayName.trim() } : {}),
    });
    return user ? toResponse(user, photos) : null;
  },

  // Removes everything Rally stores about the person. Once users have teams and
  // results, this must keep match history but replace their name with "Deleted
  // player" (see the architecture page on the Wiki).
  remove: async (firebaseUid: string) => {
    await users.deleteByFirebaseUid(firebaseUid);
  },

  getGender: (firebaseUid: string) => users.getGender(firebaseUid),

  setGender: (firebaseUid: string, gender: Gender | null) => users.setGender(firebaseUid, gender),
});
