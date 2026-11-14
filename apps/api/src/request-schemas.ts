// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Pieces of request schemas that several modules use.

// One line with at least one visible character and no invisible control characters.
export const singleLine = (maxLength: number) =>
  ({ type: "string", maxLength, pattern: "^\\P{Cc}*[^\\s\\p{Cc}]\\P{Cc}*$" }) as const;

// The standard 8-4-4-4-12 form. Anything looser reaches the database, which
// rejects it as an error (500) instead of the request being invalid (400).
export const uuid = {
  type: "string",
  pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
} as const;
