// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { skillLevels } from "./preferences.ts";
import { interestCategories, interestKeys } from "../../../../shared/interests.ts";

// Request schemas for the user routes. Fastify checks requests against them
// before the service runs.

const languages = ["EN", "FR"] as const;
const colorThemes = ["green", "blue", "pink"] as const;
const boolean = { enum: [true, false] } as const;

// At least one character that isn't a space, and no invisible control
// characters (PostgreSQL can't store some of them). Used at sign-up and when
// the name is changed in Settings.
const displayNameSchema = {
  type: "string",
  maxLength: 100,
  pattern: "^\\P{Cc}*[^\\s\\p{Cc}]\\P{Cc}*$",
} as const;

// A string, or null to clear the field. Written with anyOf (not a list of
// types) so the existing validation behaviour stays exactly the same.
const nullableString = (maxLength: number, pattern: string) => ({
  anyOf: [{ type: "null" }, { type: "string", maxLength, pattern }],
});

// A link to a profile page on the given site, for example instagram.com.
const socialProfileUrl = (domain: string) =>
  nullableString(2048, `^https://(www\\.)?${domain}\\.com/[A-Za-z0-9._-]+/?(?:[?#].*)?$`);

const interestsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["formats", "positions"],
  properties: Object.fromEntries(
    interestCategories.map((category) => [
      category,
      { type: "array", uniqueItems: true, items: { enum: interestKeys(category) } },
    ]),
  ),
};

// Fields the app may change with PATCH /users/me.
const editableFields = [
  "displayName",
  "skillLevel",
  "lookingForTeam",
  "shownBadgeKeys",
  "instagramUrl",
  "facebookUrl",
  "thoughtText",
  "interests",
  "notificationsEnabled",
  "language",
  "colorTheme",
  "colorBlindMode",
  "darkMode",
] as const;

export const directoryQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
} as const;

export const registerBodySchema = {
  type: "object",
  required: ["displayName", "ageConfirmed"],
  properties: {
    displayName: displayNameSchema,
    ageConfirmed: { const: true },
  },
} as const;

export const profileChangesBodySchema = {
  type: "object",
  additionalProperties: false,
  propertyNames: { enum: editableFields },
  // At least one field must be sent.
  anyOf: editableFields.map((field) => ({ required: [field] })),
  properties: {
    displayName: displayNameSchema,
    skillLevel: { enum: [...skillLevels, null] },
    lookingForTeam: boolean,
    shownBadgeKeys: {
      type: "array",
      maxItems: 4,
      uniqueItems: true,
      items: { type: "string", minLength: 1 },
    },
    instagramUrl: socialProfileUrl("instagram"),
    facebookUrl: socialProfileUrl("facebook"),
    thoughtText: nullableString(180, "^(?:\\P{Cc}|\\n|\\r)*$"),
    interests: interestsSchema,
    notificationsEnabled: boolean,
    language: { enum: languages },
    colorTheme: { enum: colorThemes },
    colorBlindMode: boolean,
    darkMode: boolean,
  },
};
