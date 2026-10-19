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
  {
    key: "champion",
    name: "Champion",
    tier: "Bronze",
    description: "Placeholder championship badge",
    icon: "🏆",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "winner",
    name: "Winner",
    tier: "Bronze",
    description: "Placeholder first-place badge",
    icon: "🥇",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "podium",
    name: "Podium",
    tier: "Bronze",
    description: "Placeholder podium badge",
    icon: "🥉",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "competitor",
    name: "Competitor",
    tier: "Bronze",
    description: "Placeholder participation badge",
    icon: "🎖️",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "defender",
    name: "Defender",
    tier: "Bronze",
    description: "Placeholder defensive effort medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "rally",
    name: "Rally",
    tier: "Bronze",
    description: "Placeholder long-rally medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "blocker",
    name: "Blocker",
    tier: "Bronze",
    description: "Placeholder blocking medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "server",
    name: "Server",
    tier: "Bronze",
    description: "Placeholder serving medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "team-player",
    name: "Team Player",
    tier: "Bronze",
    description: "Placeholder teamwork medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "streak",
    name: "Streak",
    tier: "Bronze",
    description: "Placeholder winning-streak medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "rising-star",
    name: "Rising Star",
    tier: "Bronze",
    description: "Placeholder rising-player medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "clutch",
    name: "Clutch",
    tier: "Bronze",
    description: "Placeholder clutch-play medal",
    icon: "⭐",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
] satisfies readonly BadgeDefinition[];
