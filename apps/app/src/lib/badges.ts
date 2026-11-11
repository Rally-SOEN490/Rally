// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { RallyUser } from "@/lib/api";

export type Badge = RallyUser["badges"][number];

// The images a badge can use, keyed by the badge's image name.
export const badgeImages = {
  "badge-gold-placeholder": require("@/assets/images/badge-gold-placeholder.png"),
} as const;

// The border colour around a badge for each tier.
export const tierColors = {
  Bronze: "#8c5a3c",
  Silver: "#9aa1a8",
  Gold: "#d4a72c",
} as const;

export const badgeImageSource = (badge: Badge) =>
  badgeImages[badge.image as keyof typeof badgeImages];

export const tierColor = (badge: Badge) => tierColors[badge.tier as keyof typeof tierColors];

// Most-received badges first, then alphabetical by key.
export const sortBadges = (badges: readonly Badge[]) =>
  [...badges].sort(
    (left, right) => right.receivedCount - left.receivedCount || left.key.localeCompare(right.key),
  );

// How far the badge is towards its next tier. Without a next tier from the
// server, the target is the next multiple of 10.
export const getBadgeProgress = (receivedCount: number, nextTierThreshold?: number | null) => {
  const safeCount = Math.max(0, receivedCount);
  const target = nextTierThreshold ?? (Math.floor(safeCount / 10) + 1) * 10;

  return {
    target,
    percentage: Math.min(safeCount / target, 1),
  };
};

// Progress for a badge that still has a tier to reach, or null when it's complete.
export const badgeProgress = (badge: Badge) =>
  badge.isComplete ? null : getBadgeProgress(badge.receivedCount, badge.nextTierThreshold);
