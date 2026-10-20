// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { UserRepository } from "./repository.ts";
import { getBadgeTier } from "../badges/catalog.ts";
import type { ProfilePhotoStorage } from "./photo-storage.ts";

// What the API sends back about a user. Internal fields like firebaseUid stay on the server.
export type UserResponse = {
  id: string;
  displayName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
  badges: Array<{
    key: string;
    name: string;
    tier: string;
    description: string;
    imageUrl: string | null;
    image: string;
    receivedCount: number;
    awardedAt: string;
  }>;
};

type UserWithBadges = NonNullable<Awaited<ReturnType<UserRepository["findByFirebaseUid"]>>>;

const toResponse = async (user: UserWithBadges, photos?: ProfilePhotoStorage): Promise<UserResponse> => ({
  id: user.id,
  displayName: user.displayName,
  bio: user.bio,
  profilePhotoUrl: user.profilePhotoKey && photos ? await photos.getUrl(user.profilePhotoKey) : null,
  createdAt: user.createdAt.toISOString(),
  badges: [...user.badges]
    .sort(
      (left, right) =>
        right.receivedCount - left.receivedCount ||
        left.badgeType.key.localeCompare(right.badgeType.key),
    )
    .map(({ badgeType, receivedCount, awardedAt }) => ({
    key: badgeType.key,
    name: badgeType.name,
    tier: getBadgeTier(badgeType.tier, receivedCount),
    description: badgeType.description,
    imageUrl: badgeType.imageUrl,
    image: badgeType.imageUrl ?? "badge-gold-placeholder",
    receivedCount,
    awardedAt: awardedAt.toISOString(),
    })),
});

export const createUserService = (users: UserRepository, photos?: ProfilePhotoStorage) => ({
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

  updateCurrent: async (firebaseUid: string, displayName: string, bio: string) => {
    const existing = await users.findByFirebaseUid(firebaseUid);
    if (!existing) return null;
    await users.updateByFirebaseUid(firebaseUid, {
      displayName: displayName.trim(),
      bio: bio.trim() || null,
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

  // Removes everything Rally stores about the person. Once users have teams and
  // results, this must keep match history but replace their name with "Deleted
  // player" (see the architecture page on the Wiki).
  remove: async (firebaseUid: string) => {
    await users.deleteByFirebaseUid(firebaseUid);
  },
});
