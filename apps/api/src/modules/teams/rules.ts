// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// The team rules, as plain code so they can be tested on their own.

export const teamNameMaxLength = 40;

// The name as stored: no spaces around it, and one space between words.
// "  Spike   Lee " becomes "Spike Lee".
export const tidyTeamName = (name: string) => name.trim().replaceAll(/\s+/g, " ");

// What makes two team names the same in one tournament: case doesn't count,
// so "Spike Lee" and "spike lee" clash.
export const teamNameKey = (name: string) => tidyTeamName(name).toLowerCase();
