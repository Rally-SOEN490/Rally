// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { ProfileChanges, UserRepository } from "./repository.ts";
import { getBadgeTier } from "../badges/catalog.ts";

// What the API sends back about a user. Internal fields like firebaseUid stay on the server.
export type UserResponse = {
  id: string;
  displayName: string;
  lookingForTeam: boolean;
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

const toResponse = (user: UserWithBadges): UserResponse => ({
  id: user.id,
  displayName: user.displayName,
  lookingForTeam: user.lookingForTeam,
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

export const createUserService = (users: UserRepository) => ({
  // The route only accepts the request if the person confirmed their age.
  register: async (firebaseUid: string, displayName: string) =>
    toResponse(
      await users.createIfMissing({
        firebaseUid,
        displayName: displayName.trim(),
        ageConfirmedAt: new Date(),
      }),
    ),

  getCurrent: async (firebaseUid: string) => {
    const user = await users.findByFirebaseUid(firebaseUid);
    return user ? toResponse(user) : null;
  },

  update: async (firebaseUid: string, changes: ProfileChanges) => {
    const user = await users.updateByFirebaseUid(firebaseUid, changes);
    return user ? toResponse(user) : null;
  },

  // Removes everything Rally stores about the person. Once users have teams and
  // results, this must keep match history but replace their name with "Deleted
  // player" (see the architecture page on the Wiki).
  remove: async (firebaseUid: string) => {
    await users.deleteByFirebaseUid(firebaseUid);
  },
});
