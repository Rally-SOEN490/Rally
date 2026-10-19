// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { describe, expect, test } from "vitest";
import { getBadgeTier } from "../src/modules/badges/catalog.ts";

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
});
