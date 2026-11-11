// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { singleLine, uuid } from "../../request-schemas.ts";
import { teamNameMaxLength } from "./rules.ts";

// Request schemas for the team routes. Fastify checks requests against them
// before the service runs.

export const tournamentParams = {
  type: "object",
  required: ["id"],
  properties: { id: uuid },
} as const;

const signUpProperties = { divisionId: uuid, name: singleLine(teamNameMaxLength) } as const;

// Only these fields: listing them in propertyNames makes an unknown field an
// error, where additionalProperties alone would quietly drop it.
export const signUpBody = {
  type: "object",
  additionalProperties: false,
  propertyNames: { enum: Object.keys(signUpProperties) },
  required: Object.keys(signUpProperties),
  properties: signUpProperties,
} as const;
