// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { describe, expect, test } from "vitest";
import { badgeCatalog, getBadgeCompletion, getBadgeTier } from "../src/modules/badges/catalog.ts";

describe("getBadgeTier", () => {
  test.each([
    ["Bronze", 0, "Bronze"],
    ["Bronze", 9, "Bronze"],
    ["Bronze", 10, "Silver"],
    ["Bronze", 20, "Gold"],
    ["Silver", 0, "Silver"],
    ["Silver", 10, "Gold"],
    ["Gold", 100, "Gold"],
  ])("returns %s for a %s badge received %d times", (baseTier, count, expected) => {
    expect(getBadgeTier(baseTier, count)).toBe(expected);
  });

  test("normalizes tier capitalization and invalid base tiers", () => {
    expect(getBadgeTier("silver", 0)).toBe("Silver");
    expect(getBadgeTier("unknown", 10)).toBe("Silver");
  });

  test("supports custom thresholds for available tiers", () => {
    const availableTiers = ["Bronze", "Silver", "Gold"] as const;
    const tierThresholds = { Bronze: 10, Silver: 25, Gold: 50 };

    expect(getBadgeTier("Bronze", 9, availableTiers, tierThresholds)).toBe("Bronze");
    expect(getBadgeTier("Bronze", 25, availableTiers, tierThresholds)).toBe("Silver");
    expect(getBadgeTier("Bronze", 50, availableTiers, tierThresholds)).toBe("Gold");
  });

  test("keeps a single-tier badge at its only available tier", () => {
    const availableTiers = ["Bronze"] as const;

    expect(getBadgeTier("Bronze", 1, availableTiers, { Bronze: 1 })).toBe("Bronze");
    expect(getBadgeTier("Bronze", 100, availableTiers, { Bronze: 1 })).toBe("Bronze");
  });

  test("reports incomplete and complete states for a single-tier badge", () => {
    const availableTiers = ["Bronze"] as const;
    const tierThresholds = { Bronze: 10 };

    expect(getBadgeCompletion("Bronze", "Bronze", availableTiers, tierThresholds, 9)).toEqual({
      isComplete: false,
      nextTierThreshold: null,
    });
    expect(getBadgeCompletion("Bronze", "Bronze", availableTiers, tierThresholds, 10)).toEqual({
      isComplete: true,
      nextTierThreshold: null,
    });
  });

  test("catalogs streak as a single-tier badge", () => {
    expect(badgeCatalog.find((badge) => badge.key === "streak")).toMatchObject({
      availableTiers: ["Bronze"],
      tierThresholds: { Bronze: 10 },
    });
  });
});
