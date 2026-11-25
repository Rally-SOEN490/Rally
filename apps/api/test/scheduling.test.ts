// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { describe, expect, test } from "vitest";
import { canPublish, scheduleProblems } from "../src/modules/scheduling/check.ts";
import {
  generateSchedule,
  type ScheduleInput,
  type ScheduleMatch,
  type ScheduleSlot,
} from "../src/modules/scheduling/generate.ts";
import { poolsAndPlayoffs, roundRobin, saturday, sunday } from "./scheduling-helpers.ts";

// 12 teams in 2 pools of 6 on 3 courts, team referees. Pools 45', playoffs 60'.
const twelveTeams = (overrides: Partial<ScheduleInput> = {}): ScheduleInput => ({
  days: [saturday],
  courts: 3,
  minRestMinutes: 0,
  referees: "TEAMS",
  matches: poolsAndPlayoffs({ teams: 12, pools: 2, poolMinutes: 45, playoffMinutes: 60 }),
  ...overrides,
});

const longMatches = poolsAndPlayoffs({ teams: 12, pools: 2, poolMinutes: 55, playoffMinutes: 60 });

const dutiesOf = (slots: ScheduleSlot[]) => {
  const duties = new Map<string, number>();
  for (const { refereeTeamId } of slots)
    if (refereeTeamId) duties.set(refereeTeamId, (duties.get(refereeTeamId) ?? 0) + 1);
  return [...duties.values()];
};

describe("round robin fixture", () => {
  test.each([4, 5, 6])("%i teams each play every other team once", (count) => {
    const pairs = roundRobin(Array.from({ length: count }, (_, i) => `T${i}`)).flat();
    expect(pairs).toHaveLength((count * (count - 1)) / 2);
    expect(new Set(pairs.map((pair) => [...pair].sort().join("-"))).size).toBe(pairs.length);
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

  test("a team that isn't playing referees every pool match, and duty is spread evenly", () => {
    const { slots } = generateSchedule(twelveTeams());
    const pool = slots.filter((slot) => !/QF|SF|-F$/.test(slot.matchId));
    expect(pool.every((slot) => slot.refereeTeamId !== null)).toBe(true);
    const duties = dutiesOf(pool);
    expect(Math.max(...duties) - Math.min(...duties)).toBeLessThanOrEqual(1);
  });

  test("playoff referees are left to the organizer until the teams are known", () => {
    const { slots } = generateSchedule(twelveTeams());
    const playoffs = slots.filter((slot) => /QF|SF|-F$/.test(slot.matchId));
    expect(playoffs.every((slot) => slot.refereeTeamId === null)).toBe(true);
  });

  test("with 5 teams, the team sitting out referees", () => {
    const input = twelveTeams({
      courts: 2,
      matches: poolsAndPlayoffs({ teams: 5, pools: 1, poolMinutes: 55 }),
    });
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled).toEqual([]);
    // 5 rounds of 2 matches: in each round, one team sits out and referees one match.
    expect(slots.filter((slot) => slot.refereeTeamId !== null)).toHaveLength(5);
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("assigns no referees when the organizer has dedicated referees", () => {
    const { slots } = generateSchedule(twelveTeams({ referees: "DEDICATED" }));
    expect(slots.every((slot) => slot.refereeTeamId === null)).toBe(true);
  });

  test("respects a minimum rest time", () => {
    const input = twelveTeams({ minRestMinutes: 15 });
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled).toEqual([]);
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("gives the same schedule for the same input", () => {
    expect(generateSchedule(twelveTeams())).toEqual(generateSchedule(twelveTeams()));
  });
});

describe("tournament days", () => {
  test("tells the organizer what doesn't fit in one day", () => {
    const input = twelveTeams({ matches: longMatches });
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled).toEqual([
      { matchId: "div-F", reason: "It doesn't fit in the tournament's days." },
    ]);
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("continues on the next day instead of at night", () => {
    const input = twelveTeams({ days: [saturday, sunday], matches: longMatches });
    const { slots, unscheduled } = generateSchedule(input);
    expect(unscheduled).toEqual([]);
    expect(slots.at(-1)?.startsAt.getTime()).toBeGreaterThanOrEqual(sunday.startsAt.getTime());
    // Every match is inside one of the two days.
    expect(scheduleProblems(input, slots)).toEqual([]);
  });

  test("shares the courts between two divisions", () => {
    const options = { teams: 8, pools: 2, poolMinutes: 45, playoffMinutes: 60 };
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
    const match = (id: string, after: string): ScheduleMatch => ({
      id,
      divisionId: "div",
      phase: "POOL",
      teamIds: [],
      after: [after],
      minutes: 60,
      round: 0,
    });
    const input = twelveTeams({ matches: [match("a", "b"), match("b", "a")] });
    expect(generateSchedule(input).unscheduled).toHaveLength(2);
  });
});

// Helpers for checking hand-edited schedules.
const match = (id: string, teamIds: string[], extra: Partial<ScheduleMatch> = {}) => ({
  id,
  divisionId: "div",
  phase: "POOL" as const,
  teamIds,
  after: [],
  minutes: 60,
  round: 0,
  ...extra,
});
const input = twelveTeams({
  days: [saturday, sunday],
  minRestMinutes: 10,
  matches: [match("a", ["X", "Y"]), match("b", ["X", "Z"]), match("c", ["W", "V"])],
});
const at = (minutes: number) => new Date(saturday.startsAt.getTime() + minutes * 60_000);
const slot = (matchId: string, court: number, start: number, ref: string | null = null) => ({
  matchId,
  court,
  startsAt: at(start),
  endsAt: at(start + 60),
  refereeTeamId: ref,
});
const messages = (slots: ScheduleSlot[], data = input) =>
  scheduleProblems(data, slots).map((p) => p.message);

describe("checking an edited schedule", () => {
  test("a team playing twice at once blocks publishing", () => {
    const problems = scheduleProblems(input, [slot("a", 1, 0), slot("b", 2, 30)]);
    expect(problems.map((p) => p.message)).toEqual(["A team plays two matches at once."]);
    expect(canPublish(problems)).toBe(false);
  });

  test("a double-booked court blocks publishing", () => {
    expect(messages([slot("a", 1, 0), slot("c", 1, 30)])).toEqual(["Court 1 is double-booked."]);
  });

  test("a match at night, before the day or on a missing court blocks publishing", () => {
    // 22:00 on Saturday is between the two days.
    expect(messages([slot("a", 1, 14 * 60)])).toEqual([
      "The match is outside the tournament's times.",
    ]);
    expect(messages([slot("a", 4, -30)])).toEqual([
      "Court 4 doesn't exist.",
      "The match is outside the tournament's times.",
    ]);
  });
});

describe("checking referees", () => {
  test("a team can't play and referee at the same time", () => {
    expect(messages([slot("a", 1, 0), slot("c", 2, 30, "Y")])).toEqual([
      "A team plays and referees at the same time.",
    ]);
  });

  test("a team can't referee its own match or two matches at once", () => {
    expect(messages([slot("a", 1, 0, "X")])).toEqual(["A team can't referee its own match."]);
    expect(messages([slot("a", 1, 0, "Q"), slot("c", 2, 0, "Q")])).toEqual([
      "A team referees two matches at once.",
    ]);
  });
});

describe("checking order and rest", () => {
  test("a playoff before the pools end blocks publishing", () => {
    const withPlayoff = {
      ...input,
      matches: [...input.matches, match("qf", [], { phase: "PLAYOFF" })],
    };
    expect(messages([slot("a", 1, 0), slot("qf", 2, 30)], withPlayoff)).toEqual([
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
