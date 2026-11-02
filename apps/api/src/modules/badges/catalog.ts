// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

export const badgeTiers = ["Bronze", "Silver", "Gold"] as const;
export type BadgeTier = (typeof badgeTiers)[number];
const defaultTierThresholds: Partial<Record<BadgeTier, number>> = {
  Bronze: 0,
  Silver: 10,
  Gold: 20,
};

export type BadgeDefinition = {
  key: string;
  name: string;
  tier: BadgeTier;
  availableTiers: readonly BadgeTier[];
  tierThresholds: Partial<Record<BadgeTier, number>>;
  description: string;
  image: string;
  autoAward: boolean;
};

type BadgeDefinitionInput = Pick<BadgeDefinition, "key" | "name" | "description"> &
  Partial<
    Pick<BadgeDefinition, "tier" | "availableTiers" | "tierThresholds" | "image" | "autoAward">
  >;

const createBadge = (definition: BadgeDefinitionInput): BadgeDefinition => ({
  tier: "Bronze",
  availableTiers: badgeTiers,
  tierThresholds: { Bronze: 0, Silver: 10, Gold: 20 },
  image: "badge-gold-placeholder",
  autoAward: true,
  ...definition,
});

type BadgeCatalogRow = [
  key: string,
  name: string,
  description: string,
  overrides?: Partial<
    Pick<BadgeDefinition, "tier" | "availableTiers" | "tierThresholds" | "image" | "autoAward">
  >,
];

export const getBadgeTier = (
  baseTier: string,
  receivedCount: number,
  availableTiers: readonly BadgeTier[] = badgeTiers,
  tierThresholds: Partial<Record<BadgeTier, number>> = defaultTierThresholds,
): BadgeTier => {
  const normalizedBaseTier =
    availableTiers.find((tier) => tier.toLowerCase() === baseTier.toLowerCase()) ??
    availableTiers[0] ??
    "Bronze";
  const baseIndex = availableTiers.indexOf(normalizedBaseTier);
  const earnedTiers = availableTiers
    .slice(baseIndex)
    .filter(
      (tier) => receivedCount >= getRelativeTierThreshold(normalizedBaseTier, tier, tierThresholds),
    );

  return earnedTiers.at(-1) ?? normalizedBaseTier;
};

export const getBadgeCompletion = (
  baseTier: BadgeTier,
  tier: BadgeTier,
  availableTiers: readonly BadgeTier[],
  tierThresholds: Partial<Record<BadgeTier, number>>,
  receivedCount: number,
) => {
  const tierIndex = availableTiers.indexOf(tier);
  const nextTier = availableTiers[tierIndex + 1];
  const nextTierThreshold = nextTier
    ? getRelativeTierThreshold(baseTier, nextTier, tierThresholds)
    : null;
  const completionThreshold =
    availableTiers.length === 1
      ? (tierThresholds[tier] ?? 0)
      : getRelativeTierThreshold(baseTier, tier, tierThresholds);

  return {
    isComplete: nextTier === undefined && receivedCount >= completionThreshold,
    nextTierThreshold,
  };
};

const getRelativeTierThreshold = (
  baseTier: BadgeTier,
  tier: BadgeTier,
  tierThresholds: Partial<Record<BadgeTier, number>>,
) => Math.max(0, (tierThresholds[tier] ?? 0) - (tierThresholds[baseTier] ?? 0));

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
  [
    "streak",
    "Streak",
    "Placeholder winning-streak medal",
    { availableTiers: ["Bronze"], tierThresholds: { Bronze: 10 } },
  ],
  ["rising-star", "Rising Star", "Placeholder rising-player medal"],
  ["clutch", "Clutch", "Placeholder clutch-play medal"],
];

export const badgeCatalog = badgeCatalogRows.map(([key, name, description, overrides]) =>
  createBadge({ key, name, description, ...overrides }),
) satisfies readonly BadgeDefinition[];
