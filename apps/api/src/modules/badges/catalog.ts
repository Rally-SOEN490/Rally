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

type BadgeDefinitionInput = Pick<BadgeDefinition, "key" | "name" | "description"> &
  Partial<Pick<BadgeDefinition, "tier" | "image" | "autoAward">>;

const createBadge = (definition: BadgeDefinitionInput): BadgeDefinition => ({
  tier: "Bronze",
  image: "badge-gold-placeholder",
  autoAward: true,
  ...definition,
});

type BadgeCatalogRow = [
  key: string,
  name: string,
  description: string,
  overrides?: Partial<Pick<BadgeDefinition, "tier" | "image" | "autoAward">>,
];

export const getBadgeTier = (baseTier: string, receivedCount: number): BadgeTier => {
  const normalizedBaseTier =
    badgeTiers.find((tier) => tier.toLowerCase() === baseTier.toLowerCase()) ?? "Bronze";
  const baseIndex = badgeTiers.indexOf(normalizedBaseTier);
  const earnedSteps = Math.floor(Math.max(0, receivedCount) / 10);
  return badgeTiers[Math.min(baseIndex + earnedSteps, badgeTiers.length - 1)];
};

// Add future badge types here. The image identifier maps to a bundled app
// asset, so changing artwork does not require changing the player-assignment model.
const badgeCatalogRows: readonly BadgeCatalogRow[] = [
  ["champion", "Champion", "Placeholder championship badge"],
  ["winner", "Winner", "Placeholder first-place badge"],
  ["podium", "Podium", "Placeholder podium badge"],
  ["competitor", "Competitor", "Placeholder participation badge"],
  ["defender", "Defender", "Placeholder defensive effort medal"],
  ["rally", "Rally", "Placeholder long-rally medal"],
  ["blocker", "Blocker", "Placeholder blocking medal"],
  ["server", "Server", "Placeholder serving medal"],
  ["team-player", "Team Player", "Placeholder teamwork medal"],
  ["streak", "Streak", "Placeholder winning-streak medal"],
  ["rising-star", "Rising Star", "Placeholder rising-player medal"],
  ["clutch", "Clutch", "Placeholder clutch-play medal"],
];

export const badgeCatalog = badgeCatalogRows.map(([key, name, description, overrides]) =>
  createBadge({ key, name, description, ...overrides }),
) satisfies readonly BadgeDefinition[];
