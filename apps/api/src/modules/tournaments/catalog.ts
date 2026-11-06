// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { DivisionFormat, DivisionLevel, DivisionType } from "../../generated/prisma/client.ts";

// The values the API uses, mapped to the database's. Formats, types and levels
// are fixed lists in the database (#71), so adding one is a migration.

export const formats = {
  "2v2": "TWO_V_TWO",
  "3v3": "THREE_V_THREE",
  "4v4": "FOUR_V_FOUR",
  "6v6": "SIX_V_SIX",
  "9v9": "NINE_V_NINE",
} as const satisfies Record<string, DivisionFormat>;

export const types = {
  coed: "COED",
  men: "MEN",
  women: "WOMEN",
} as const satisfies Record<string, DivisionType>;

export const levels = {
  "C-": "C_MINUS",
  C: "C",
  "C+": "C_PLUS",
  B: "B",
  "B+": "B_PLUS",
  A: "A",
  Open: "OPEN",
  Elite: "ELITE",
} as const satisfies Record<string, DivisionLevel>;

export type FormatName = keyof typeof formats;
export type TypeName = keyof typeof types;
export type LevelName = keyof typeof levels;

const reverse = <K extends string, V extends string>(map: Record<K, V>) =>
  Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key])) as Record<V, K>;

export const formatName = reverse(formats);
export const typeName = reverse(types);
export const levelName = reverse(levels);
export const levelOrder = Object.keys(levels) as LevelName[];

export const limits = {
  nameMaxLength: 100,
  locationMaxLength: 200,
  descriptionMaxLength: 5000,
  divisionNameMaxLength: 60,
  minCourts: 1,
  maxCourts: 50,
  minTeams: 2,
  maxTeams: 64,
  maxPriceCents: 1_000_000,
} as const;
