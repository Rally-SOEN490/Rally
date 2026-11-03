// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

export const skillLevels = ["C", "C+", "B-", "B"] as const;
export type SkillLevel = (typeof skillLevels)[number];

export const interestFormats = [
  "indoor-6s",
  "beach-2s",
  "9-man",
  "indoor-4s",
  "beach-4s",
  "grass-4s",
] as const;
export const interestPositions = ["libero", "outside", "setter", "middle", "opposite"] as const;
export const competitionTypes = ["mixed", "men", "women"] as const;
