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
] satisfies readonly BadgeDefinition[];
