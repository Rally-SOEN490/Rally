// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { formats, levels, limits, types } from "./catalog.ts";
import { localDateTimePattern } from "./montreal-time.ts";

// Request schemas for the tournament routes. Fastify checks requests against
// them before the service runs.

// One line with at least one visible character and no invisible control characters.
const singleLine = (maxLength: number) =>
  ({ type: "string", maxLength, pattern: "^\\P{Cc}*[^\\s\\p{Cc}]\\P{Cc}*$" }) as const;

// Allows null as well. Written as a list of types, not anyOf, because Fastify's
// validator would otherwise turn 0, false or "" into null instead of rejecting them.
const nullable = <T extends { type: string }>(schema: T) =>
  ({ ...schema, type: [schema.type, "null"] }) as const;

const montrealTime = nullable({ type: "string", pattern: localDateTimePattern });

const tournamentProperties = {
  name: singleLine(limits.nameMaxLength),
  location: nullable(singleLine(limits.locationMaxLength)),
  courts: nullable({ type: "integer", minimum: limits.minCourts, maximum: limits.maxCourts }),
  // Line breaks, tabs and emojis are kept; other control characters aren't allowed.
  description: nullable({
    type: "string",
    maxLength: limits.descriptionMaxLength,
    pattern: "^(?:\\P{Cc}|\\n|\\r|\\t)*$",
  }),
  startsAt: montrealTime,
  endsAt: montrealTime,
  registrationOpensAt: montrealTime,
  registrationClosesAt: montrealTime,
} as const;

const divisionProperties = {
  name: singleLine(limits.divisionNameMaxLength),
  format: { enum: Object.keys(formats) },
  type: { enum: Object.keys(types) },
  levels: {
    type: "array",
    minItems: 1,
    uniqueItems: true,
    items: { enum: Object.keys(levels) },
  },
  maxTeams: { type: "integer", minimum: limits.minTeams, maximum: limits.maxTeams },
  priceCents: { type: "integer", minimum: 0, maximum: limits.maxPriceCents },
} as const;

const uuid = { type: "string", pattern: "^[0-9a-fA-F-]{36}$" } as const;

export const tournamentParams = {
  type: "object",
  required: ["id"],
  properties: { id: uuid },
} as const;

export const divisionParams = {
  type: "object",
  required: ["id", "divisionId"],
  properties: { id: uuid, divisionId: uuid },
} as const;

// At least one field, and only known ones (unknown fields are an error, not ignored).
const changes = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  propertyNames: { enum: Object.keys(properties) },
  anyOf: Object.keys(properties).map((field) => ({ required: [field] })),
  properties,
});

export const createTournamentBody = {
  type: "object",
  additionalProperties: false,
  propertyNames: { enum: Object.keys(tournamentProperties) },
  required: ["name"],
  properties: tournamentProperties,
} as const;

export const updateTournamentBody = changes(tournamentProperties);

export const createDivisionBody = {
  type: "object",
  additionalProperties: false,
  propertyNames: { enum: Object.keys(divisionProperties) },
  required: Object.keys(divisionProperties),
  properties: divisionProperties,
} as const;

export const updateDivisionBody = changes(divisionProperties);
