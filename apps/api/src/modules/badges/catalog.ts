// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

export const badgeTiers = ["Bronze", "Silver", "Gold"] as const;
export type BadgeTier = (typeof badgeTiers)[number];

export type BadgeDefinition = {
  key: string;
  name: string;
  tier: BadgeTier;
  description: string;
  icon: string;
  image: string;
  autoAward: boolean;
};

type BadgeDefinitionInput = Pick<BadgeDefinition, "key" | "name" | "description" | "icon"> &
  Partial<Pick<BadgeDefinition, "tier" | "image" | "autoAward">>;

const createBadge = (definition: BadgeDefinitionInput): BadgeDefinition => ({
  tier: "Bronze",
  image: "badge-gold-placeholder",
  autoAward: true,
  ...definition,
});

export const getBadgeTier = (baseTier: string, receivedCount: number): BadgeTier => {
  const normalizedBaseTier =
    badgeTiers.find((tier) => tier.toLowerCase() === baseTier.toLowerCase()) ?? "Bronze";
  const baseIndex = badgeTiers.indexOf(normalizedBaseTier);
  const earnedSteps = Math.floor(Math.max(0, receivedCount) / 10);
  return badgeTiers[Math.min(baseIndex + earnedSteps, badgeTiers.length - 1)];
};

// Add future badge types here. The image identifier maps to a bundled app
// asset, so changing artwork does not require changing the player-assignment model.
export const badgeCatalog = [
  createBadge({
    key: "champion",
    name: "Champion",
    description: "Placeholder championship badge",
    icon: "🏆",
  }),
  createBadge({
    key: "winner",
    name: "Winner",
    description: "Placeholder first-place badge",
    icon: "🥇",
  }),
  createBadge({
    key: "podium",
    name: "Podium",
    description: "Placeholder podium badge",
    icon: "🥉",
  }),
  createBadge({
    key: "competitor",
    name: "Competitor",
    description: "Placeholder participation badge",
    icon: "🎖️",
  }),
  createBadge({
    key: "defender",
    name: "Defender",
    description: "Placeholder defensive effort medal",
    icon: "⭐",
  }),
  createBadge({
    key: "rally",
    name: "Rally",
    description: "Placeholder long-rally medal",
    icon: "⭐",
  }),
  createBadge({
    key: "blocker",
    name: "Blocker",
    description: "Placeholder blocking medal",
    icon: "⭐",
  }),
  createBadge({
    key: "server",
    name: "Server",
    description: "Placeholder serving medal",
    icon: "⭐",
  }),
  createBadge({
    key: "team-player",
    name: "Team Player",
    description: "Placeholder teamwork medal",
    icon: "⭐",
  }),
  createBadge({
    key: "streak",
    name: "Streak",
    description: "Placeholder winning-streak medal",
    icon: "⭐",
  }),
  createBadge({
    key: "rising-star",
    name: "Rising Star",
    description: "Placeholder rising-player medal",
    icon: "⭐",
  }),
  createBadge({
    key: "clutch",
    name: "Clutch",
    description: "Placeholder clutch-play medal",
    icon: "⭐",
  }),
] satisfies readonly BadgeDefinition[];
