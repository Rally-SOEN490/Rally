// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { ScheduleMatch, TournamentDay } from "../src/modules/scheduling/generate.ts";

// Test fixtures only. The real pool matchups and bracket come from the pools and
// playoffs spike (#361); the scheduler receives them as given.

// Circle method: every team plays every other team once, at most once per round.
// With an odd number of teams, one team sits out each round.
export function roundRobin(teamIds: string[]): Array<Array<[string, string]>> {
  const teams: Array<string | null> = [...teamIds];
  if (teams.length % 2 === 1) teams.push(null);
  const rounds: Array<Array<[string, string]>> = [];
  for (let round = 0; round < teams.length - 1; round++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < teams.length / 2; i++) {
      const [home, away] = [teams[i], teams[teams.length - 1 - i]];
      if (home !== null && away !== null) pairs.push([home, away]);
    }
    rounds.push(pairs);
    teams.splice(1, 0, teams.pop() as string | null);
  }
  return rounds;
}

function poolMatches(divisionId: string, pool: string, size: number, minutes: number) {
  const teamIds = Array.from({ length: size }, (_, i) => `${divisionId}-${pool}${i + 1}`);
  return roundRobin(teamIds).flatMap((pairs, round) =>
    pairs.map(([home, away], i): ScheduleMatch => ({
      id: `${divisionId}-${pool}-R${round + 1}-${i + 1}`,
      divisionId,
      phase: "POOL",
      teamIds: [home, away],
      after: [],
      minutes,
      round,
    })),
  );
}

// Quarterfinals (A1-B4, B2-A3, B1-A4, A2-B3), semifinals and a final.
function bracket(divisionId: string, minutes: number): ScheduleMatch[] {
  const playoff = (id: string, round: number, after: string[]): ScheduleMatch => ({
    id: `${divisionId}-${id}`,
    divisionId,
    phase: "PLAYOFF",
    teamIds: [],
    after: after.map((a) => `${divisionId}-${a}`),
    minutes,
    round,
  });
  return [
    ...["QF1", "QF2", "QF3", "QF4"].map((id) => playoff(id, 0, [])),
    playoff("SF1", 1, ["QF1", "QF2"]),
    playoff("SF2", 1, ["QF3", "QF4"]),
    playoff("F", 2, ["SF1", "SF2"]),
  ];
}

// One division: teams split into pools that each play a round robin, then (by
// default) the top 4 of two pools go to a bracket.
export function poolsAndPlayoffs(options: {
  teams: number;
  pools: number;
  poolMinutes: number;
  playoffMinutes?: number;
  divisionId?: string;
}): ScheduleMatch[] {
  const divisionId = options.divisionId ?? "div";
  const pools = Array.from({ length: options.pools }, (_, p) =>
    poolMatches(
      divisionId,
      String.fromCharCode(65 + p),
      Math.ceil((options.teams - p) / options.pools),
      options.poolMinutes,
    ),
  ).flat();
  if (options.playoffMinutes === undefined) return pools;
  return [...pools, ...bracket(divisionId, options.playoffMinutes)];
}

// Montreal in November is UTC-5.
export const saturday: TournamentDay = {
  startsAt: new Date("2027-11-13T13:00Z"), // 8:00
  endsAt: new Date("2027-11-14T02:00Z"), // 21:00
};
export const sunday: TournamentDay = {
  startsAt: new Date("2027-11-14T14:00Z"), // 9:00
  endsAt: new Date("2027-11-14T23:00Z"), // 18:00
};
