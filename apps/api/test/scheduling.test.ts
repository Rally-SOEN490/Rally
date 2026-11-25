// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { describe, expect, test } from "vitest";
import { canPublish, scheduleProblems } from "../src/modules/scheduling/check.ts";
import {
  generateSchedule,
  type ScheduleInput,
  type ScheduleMatch,
} from "../src/modules/scheduling/generate.ts";
import {
  estimateMatchMinutes,
  forfeitSetScores,
  formatProblems,
  PLAYOFF_DEFAULT,
  POOL_DEFAULT,
} from "../src/modules/scheduling/match-format.ts";
import { roundRobin } from "../src/modules/scheduling/round-robin.ts";
import { poolsAndPlayoffs, saturday } from "./scheduling-helpers.ts";

// Sets to 21 (cap 23) in pools and best of 3 to 21/15 in playoffs: shorter than
// the defaults, which is what a 12-team day on 3 courts needs.
const shortPools = { ...POOL_DEFAULT, pointsPerSet: 21, pointCap: 23 };
const shortPlayoffs = { ...PLAYOFF_DEFAULT, pointsPerSet: 21, pointCap: 23 };

const twelveTeams = (overrides: Partial<ScheduleInput> = {}): ScheduleInput => ({
  ...saturday,
  courts: 3,
  minRestMinutes: 0,
  matches: poolsAndPlayoffs({
    teams: 12,
    pools: 2,
    poolFormat: shortPools,
    playoffFormat: shortPlayoffs,
  }),
  ...overrides,
});

const match = (
  id: string,
  teamIds: string[],
  extra: Partial<ScheduleMatch> = {},
): ScheduleMatch => ({
  id,
  divisionId: "div",
  phase: "POOL",
  teamIds,
  after: [],
  minutes: 60,
  round: 0,
  ...extra,
});

describe("match formats", () => {
  test("the defaults are valid", () => {
    expect(formatProblems(POOL_DEFAULT)).toEqual([]);
    expect(formatProblems(PLAYOFF_DEFAULT)).toEqual([]);
  });

  test.each([
    [{ sets: 0 }, "Sets must be a positive whole number."],
    [{ mode: "BEST_OF" as const, sets: 2 }, "A best-of match needs an odd number of sets."],
    [{ pointCap: 25 }, "The point cap must be higher than the points to win a set."],
    [{ decidingSetPoints: 15 }, "Only a best-of match has a deciding set."],
    [{ mode: "TIMED" as const }, "A timed match needs a time limit in minutes."],
    [{ winBy: 3 }, "Win by must be 1 or 2."],
  ])("rejects %o", (change, message) => {
    expect(formatProblems({ ...POOL_DEFAULT, ...change })).toContain(message);
  });

  test("estimates match length from points, rounded up to 5 minutes", () => {
    // 5 warm-up + 23 + 23 + 2 between sets = 53.
    expect(estimateMatchMinutes(POOL_DEFAULT)).toBe(55);
    // 5 + 23 + 23 + 14 (deciding set to 15) + 2 breaks of 2 = 69.
    expect(estimateMatchMinutes(PLAYOFF_DEFAULT)).toBe(70);
    expect(estimateMatchMinutes({ ...POOL_DEFAULT, setMinutes: 20 })).toBe(50);
    expect(estimateMatchMinutes({ ...POOL_DEFAULT, mode: "TIMED", timeLimitMinutes: 40 })).toBe(45);
  });

  test("a forfeit counts as every set needed, at the target to 0", () => {
    expect(forfeitSetScores(POOL_DEFAULT)).toEqual([
      [25, 0],
      [25, 0],
    ]);
    expect(forfeitSetScores(PLAYOFF_DEFAULT)).toEqual([
      [25, 0],
      [25, 0],
    ]);
  });
});

describe("round robin", () => {
  test.each([4, 5, 6])("%i teams each play every other team once", (count) => {
    const teams = Array.from({ length: count }, (_, i) => `T${i}`);
    const pairs = roundRobin(teams).flat();
    expect(pairs).toHaveLength((count * (count - 1)) / 2);
    expect(new Set(pairs.map((pair) => [...pair].sort().join("-"))).size).toBe(pairs.length);
  });

  test("a team plays at most once per round", () => {
    for (const round of roundRobin(["A", "B", "C", "D", "E", "F"]))
      expect(new Set(round.flat()).size).toBe(round.length * 2);
  });
});

describe("schedule generation", () => {
  test("schedules a 12-team, 2-pool division on 3 courts with no conflicts", () => {
    const input = twelveTeams();
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled).toEqual([]);
    // 2 pools of 6: 15 matches each, then 7 playoff matches.
    expect(slots).toHaveLength(37);
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("respects a minimum rest time", () => {
    const input = twelveTeams({ minRestMinutes: 15 });
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled).toEqual([]);
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("tells the organizer what doesn't fit", () => {
    // With 2 sets to 25 the pools alone take 10 rounds of 55 minutes on 3 courts.
    const input = twelveTeams({
      matches: poolsAndPlayoffs({
        teams: 12,
        pools: 2,
        poolFormat: POOL_DEFAULT,
        playoffFormat: PLAYOFF_DEFAULT,
      }),
    });
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled.map((u) => u.matchId)).toContain("div-F");
    expect(unscheduled[0].reason).toBe("It doesn't fit before the tournament ends.");
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("gives the same schedule for the same input", () => {
    expect(generateSchedule(twelveTeams())).toEqual(generateSchedule(twelveTeams()));
  });
});

describe("schedule generation edge cases", () => {
  test("shares the courts between two divisions", () => {
    const options = { teams: 8, pools: 2, poolFormat: shortPools, playoffFormat: shortPlayoffs };
    const input = twelveTeams({
      courts: 4,
      matches: [
        ...poolsAndPlayoffs({ ...options, divisionId: "men" }),
        ...poolsAndPlayoffs({ ...options, divisionId: "women" }),
      ],
    });
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled).toEqual([]);
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("reports matches that wait for each other", () => {
    const input = twelveTeams({
      matches: [match("a", ["X", "Y"], { after: ["b"] }), match("b", ["Z", "W"], { after: ["a"] })],
    });
    expect(generateSchedule(input).unscheduled).toHaveLength(2);
  });
});

describe("checking an edited schedule", () => {
  const input = twelveTeams({
    minRestMinutes: 10,
    matches: [match("a", ["X", "Y"]), match("b", ["X", "Z"]), match("c", ["W", "V"])],
  });
  const at = (minutes: number) => new Date(saturday.startsAt.getTime() + minutes * 60_000);
  const slot = (matchId: string, court: number, start: number) => ({
    matchId,
    court,
    startsAt: at(start),
    endsAt: at(start + 60),
  });

  test("a team playing twice at once blocks publishing", () => {
    const problems = scheduleProblems(input, [slot("a", 1, 0), slot("b", 2, 30)]);
    expect(problems.map((p) => p.message)).toEqual(["A team plays two matches at once."]);
    expect(canPublish(problems)).toBe(false);
  });

  test("a double-booked court blocks publishing", () => {
    const problems = scheduleProblems(input, [slot("a", 1, 0), slot("c", 1, 30)]);
    expect(problems.map((p) => p.message)).toEqual(["Court 1 is double-booked."]);
  });

  test("a match outside the tournament or on a missing court blocks publishing", () => {
    const problems = scheduleProblems(input, [slot("a", 4, -30)]);
    expect(problems.map((p) => p.message)).toEqual([
      "Court 4 doesn't exist.",
      "The match is outside the tournament's times.",
    ]);
  });

  test("a playoff before the pools end blocks publishing", () => {
    const withPlayoff = {
      ...input,
      matches: [...input.matches, match("qf", [], { phase: "PLAYOFF" })],
    };
    const problems = scheduleProblems(withPlayoff, [slot("a", 1, 0), slot("qf", 2, 30)]);
    expect(problems.map((p) => p.message)).toEqual([
      "The match starts before a match it waits for has ended.",
    ]);
  });

  test("too little rest is only a warning", () => {
    const problems = scheduleProblems(input, [slot("a", 1, 0), slot("b", 2, 65)]);
    expect(problems).toEqual([
      { severity: "WARNING", matchIds: ["a", "b"], message: "A team rests less than 10 minutes." },
    ]);
    expect(canPublish(problems)).toBe(true);
  });
});
