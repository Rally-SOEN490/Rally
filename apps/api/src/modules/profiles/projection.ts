// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { getBadgeTier } from "../badges/catalog.ts";
import type { ProfileRepository } from "./repository.ts";
import { privacyResponse } from "./privacy.ts";

type Player = NonNullable<Awaited<ReturnType<ProfileRepository["findPlayer"]>>>;
export const safeImageUrl = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
};
const socialUrl = (value: string | null | undefined, domain: string) => {
  const safe = safeImageUrl(value);
  if (!safe) return null;
  const host = new URL(safe).hostname;
  return host === domain || host.endsWith(`.${domain}`) ? safe : null;
};

// Construct a fresh allowlisted response. Never spread a database row into it.
// An absent key means the owner has not shared that section.
export const publicProfile = (player: Player) => {
  const privacy = privacyResponse(player.profilePrivacy);
  const details = player.playerProfile;
  return {
    id: player.id,
    displayName: player.displayName,
    ...(privacy.showPhoto && { photoUrl: safeImageUrl(details?.photoUrl) }),
    ...(privacy.showBio && { bio: details?.bio ?? null }),
    ...(privacy.showStatus && {
      statusMessage: details?.statusMessage ?? null,
    }),
    ...(privacy.showInterests && { interests: details?.interests ?? [] }),
    ...(privacy.showSocialLinks && {
      socialLinks: {
        facebook: socialUrl(details?.facebookUrl, "facebook.com"),
        instagram: socialUrl(details?.instagramUrl, "instagram.com"),
      },
    }),
    ...(privacy.showMemberSince && {
      memberSince: player.createdAt.toISOString(),
    }),
    ...(privacy.showBadges && {
      badges: [...player.badges]
        .sort(
          (left, right) =>
            right.receivedCount - left.receivedCount ||
            left.badgeType.key.localeCompare(right.badgeType.key),
        )
        .map(({ badgeType, receivedCount, awardedAt }) => ({
          key: badgeType.key,
          name: badgeType.name,
          description: badgeType.description,
          tier: getBadgeTier(badgeType.tier, receivedCount),
          imageUrl: safeImageUrl(badgeType.imageUrl),
          image: "badge-gold-placeholder",
          receivedCount,
          awardedAt: awardedAt.toISOString(),
        })),
    }),
  };
};
