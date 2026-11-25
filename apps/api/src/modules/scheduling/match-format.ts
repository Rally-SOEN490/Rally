// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Match formats (RALLY-257 spike, story RALLY-70). Pure code: no Fastify or Prisma,
// so scores, standings and the scheduler can all use it. See
// docs/architecture/scheduling.md.

// BEST_OF: the match ends when a team wins most sets (best of 3: first to 2).
// FIXED_SETS: every set is played (2 sets in pools), so a match can end 1-1.
// TIMED: play until the time runs out; the set count is only a limit.
export type MatchFormatMode = "BEST_OF" | "FIXED_SETS" | "TIMED";

export type MatchFormat = {
  mode: MatchFormatMode;
  sets: number;
  pointsPerSet: number;
  // The last set of a BEST_OF match, e.g. 15. Null plays it to pointsPerSet.
  decidingSetPoints: number | null;
  // 2 means win by 2. 1 means the first team to the target wins.
  winBy: number;
  // Win by 2 stops at the cap: at 26-26 with a cap of 27, the next point wins.
  // Null means no cap.
  pointCap: number | null;
  decidingSetPointCap: number | null;
  // Only for TIMED.
  timeLimitMinutes: number | null;
  // Null lets estimateMatchMinutes work it out from the points (RALLY-211).
  setMinutes: number | null;
  minutesBetweenSets: number;
  // Warm-up and changeover before the next match on the court.
  warmupMinutes: number;
};

// The defaults follow the common Canadian rec format: 2 sets to 25 in pools,
// best of 3 in playoffs with the third set to 15. Chau still has to confirm them.
export const POOL_DEFAULT: MatchFormat = {
  mode: "FIXED_SETS",
  sets: 2,
  pointsPerSet: 25,
  decidingSetPoints: null,
  winBy: 2,
  pointCap: 27,
  decidingSetPointCap: null,
  timeLimitMinutes: null,
  setMinutes: null,
  minutesBetweenSets: 2,
  warmupMinutes: 5,
};

export const PLAYOFF_DEFAULT: MatchFormat = {
  ...POOL_DEFAULT,
  mode: "BEST_OF",
  sets: 3,
  decidingSetPoints: 15,
  decidingSetPointCap: 17,
};

const isPositiveWhole = (n: number) => Number.isInteger(n) && n > 0;

// Each rule is a check and the message shown when it fails.
const RULES: Array<[(format: MatchFormat) => boolean, string]> = [
  [(f) => !isPositiveWhole(f.sets), "Sets must be a positive whole number."],
  [(f) => f.mode === "BEST_OF" && f.sets % 2 === 0, "A best-of match needs an odd number of sets."],
  [(f) => !isPositiveWhole(f.pointsPerSet), "Points per set must be a positive whole number."],
  [(f) => f.winBy !== 1 && f.winBy !== 2, "Win by must be 1 or 2."],
  [
    (f) => f.pointCap !== null && f.pointCap <= f.pointsPerSet,
    "The point cap must be higher than the points to win a set.",
  ],
  [
    (f) => f.decidingSetPoints !== null && f.mode !== "BEST_OF",
    "Only a best-of match has a deciding set.",
  ],
  [
    (f) => f.decidingSetPoints !== null && !isPositiveWhole(f.decidingSetPoints),
    "Deciding set points must be a positive whole number.",
  ],
  [
    (f) =>
      f.decidingSetPointCap !== null &&
      f.decidingSetPointCap <= (f.decidingSetPoints ?? f.pointsPerSet),
    "The deciding set cap must be higher than its points to win.",
  ],
  [
    (f) => f.mode === "TIMED" && !isPositiveWhole(f.timeLimitMinutes ?? 0),
    "A timed match needs a time limit in minutes.",
  ],
  [
    (f) => f.setMinutes !== null && !isPositiveWhole(f.setMinutes),
    "Set length must be a positive whole number of minutes.",
  ],
  [(f) => f.minutesBetweenSets < 0 || f.warmupMinutes < 0, "Breaks can't be negative."],
];

// Returns the problems to show the organizer. An empty list means the format is valid.
export function formatProblems(format: MatchFormat): string[] {
  return RULES.filter(([fails]) => fails(format)).map(([, message]) => message);
}

// About 0.9 minutes per point to win: a set to 25 ends near 25-20, so about 45
// rallies of about 30 seconds each, dead time included. To calibrate with Chau
// (RALLY-211).
export const MINUTES_PER_POINT = 0.9;

function estimateSetMinutes(points: number): number {
  return Math.ceil(points * MINUTES_PER_POINT);
}

// How long the court is booked for one match. A best-of match is booked for every
// set it could need, so a long match doesn't make the rest of the day run late.
export function estimateMatchMinutes(format: MatchFormat): number {
  if (format.mode === "TIMED") return format.warmupMinutes + (format.timeLimitMinutes ?? 0);

  const setLengths = Array.from({ length: format.sets }, (_, i) => {
    if (format.setMinutes !== null) return format.setMinutes;
    const isDeciding = format.mode === "BEST_OF" && i === format.sets - 1;
    const points = isDeciding
      ? (format.decidingSetPoints ?? format.pointsPerSet)
      : format.pointsPerSet;
    return estimateSetMinutes(points);
  });
  const playing = setLengths.reduce((sum, minutes) => sum + minutes, 0);
  const breaks = (format.sets - 1) * format.minutesBetweenSets;
  // Round up to 5 minutes so start times look like 10:05, not 10:03.
  return Math.ceil((format.warmupMinutes + playing + breaks) / 5) * 5;
}

// Forfeits (RALLY-87). A forfeit is stored as a result type with its winner, not as
// fake set scores. Standings read the rule below from the stored format, so a
// forfeit counts as a win by every set needed, each set at the target score to 0.
export type ForfeitRule = { setsAwarded: "ALL_NEEDED"; pointsPerSet: "TARGET" };
export const FORFEIT_DEFAULT: ForfeitRule = { setsAwarded: "ALL_NEEDED", pointsPerSet: "TARGET" };

// The set scores a forfeit counts as, from the winner's side.
export function forfeitSetScores(format: MatchFormat): Array<[number, number]> {
  const setsNeeded = format.mode === "BEST_OF" ? Math.ceil(format.sets / 2) : format.sets;
  return Array.from({ length: setsNeeded }, () => [format.pointsPerSet, 0]);
}
