// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { ProfileChanges, UserRepository } from "./repository.ts";
import { badgeCatalog, getBadgeCompletion, getBadgeTier } from "../badges/catalog.ts";

// What the API sends back about a user. Internal fields like firebaseUid stay on the server.
export type UserResponse = {
  id: string;
  displayName: string;
  lookingForTeam: boolean;
  shownBadgeKeys: string[];
  instagramUrl: string | null;
  facebookUrl: string | null;
  thoughtText: string | null;
  thoughtSong: string | null;
  thoughtGif: string | null;
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

export type Gender = "male" | "female";

type UserWithBadges = NonNullable<Awaited<ReturnType<UserRepository["findByFirebaseUid"]>>>;

const toResponse = (user: UserWithBadges): UserResponse => ({
  id: user.id,
  displayName: user.displayName,
  lookingForTeam: user.lookingForTeam,
  shownBadgeKeys: [...user.shownBadgeKeys],
  instagramUrl: user.instagramUrl,
  facebookUrl: user.facebookUrl,
  thoughtText: user.thoughtText,
  thoughtSong: user.thoughtSong,
  thoughtGif: user.thoughtGif,
  createdAt: user.createdAt.toISOString(),
  badges: [...user.badges]
    .sort(
      (left, right) =>
        right.receivedCount - left.receivedCount ||
        left.badgeType.key.localeCompare(right.badgeType.key),
    )
    .map(({ badgeType, receivedCount, awardedAt }) => {
      const definition = badgeCatalog.find((badge) => badge.key === badgeType.key);
      const availableTiers = definition?.availableTiers ?? ["Bronze"];
      const tierThresholds = definition?.tierThresholds ?? { Bronze: 0 };
      const tier = getBadgeTier(
        badgeType.tier,
        receivedCount,
        availableTiers,
        tierThresholds,
      );
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
    }),
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

  getGender: (firebaseUid: string) => users.getGender(firebaseUid),

  setGender: (firebaseUid: string, gender: Gender | null) => users.setGender(firebaseUid, gender),
});
