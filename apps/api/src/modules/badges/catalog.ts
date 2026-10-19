// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

export const badgeTiers = ["Bronze", "Silver", "Gold"] as const;
export type BadgeTier = (typeof badgeTiers)[number];

export type BadgeDefinition = {
  key: string;
  name: string;
  tier: BadgeTier;
  description: string;
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
    tier: "Gold",
    description: "Placeholder championship badge",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "winner",
    name: "Winner",
    tier: "Gold",
    description: "Placeholder first-place badge",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "podium",
    name: "Podium",
    tier: "Bronze",
    description: "Placeholder podium badge",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "competitor",
    name: "Competitor",
    tier: "Silver",
    description: "Placeholder participation badge",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "defender",
    name: "Defender",
    tier: "Bronze",
    description: "Placeholder defensive effort medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "rally",
    name: "Rally",
    tier: "Bronze",
    description: "Placeholder long-rally medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "blocker",
    name: "Blocker",
    tier: "Silver",
    description: "Placeholder blocking medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "server",
    name: "Server",
    tier: "Silver",
    description: "Placeholder serving medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "team-player",
    name: "Team Player",
    tier: "Bronze",
    description: "Placeholder teamwork medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "streak",
    name: "Streak",
    tier: "Gold",
    description: "Placeholder winning-streak medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "rising-star",
    name: "Rising Star",
    tier: "Silver",
    description: "Placeholder rising-player medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
  {
    key: "clutch",
    name: "Clutch",
    tier: "Gold",
    description: "Placeholder clutch-play medal",
    image: "badge-gold-placeholder",
    autoAward: true,
  },
] satisfies readonly BadgeDefinition[];
