// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { ScheduleMatch } from "../src/modules/scheduling/generate.ts";
import { estimateMatchMinutes, type MatchFormat } from "../src/modules/scheduling/match-format.ts";
import { roundRobin } from "../src/modules/scheduling/round-robin.ts";

// One division: teams split into pools that each play a round robin, then the top
// 4 of two pools cross over into quarterfinals (A1-B4, B2-A3, B1-A4, A2-B3),
// semifinals and a final. Real seeding comes from the pools and playoffs spike (#361).
export function poolsAndPlayoffs(options: {
  teams: number;
  pools: number;
  poolFormat: MatchFormat;
  playoffFormat: MatchFormat;
  divisionId?: string;
}): ScheduleMatch[] {
  const divisionId = options.divisionId ?? "div";
  const matches: ScheduleMatch[] = [];
  const poolMinutes = estimateMatchMinutes(options.poolFormat);
  const playoffMinutes = estimateMatchMinutes(options.playoffFormat);

  for (let p = 0; p < options.pools; p++) {
    const pool = String.fromCharCode(65 + p);
    const teamIds = Array.from(
      { length: Math.ceil((options.teams - p) / options.pools) },
      (_, i) => `${divisionId}-${pool}${i + 1}`,
    );
    roundRobin(teamIds).forEach((pairs, round) =>
      pairs.forEach(([home, away], i) =>
        matches.push({
          id: `${divisionId}-${pool}-R${round + 1}-${i + 1}`,
          divisionId,
          phase: "POOL",
          teamIds: [home, away],
          after: [],
          minutes: poolMinutes,
          round,
        }),
      ),
    );
  }

  const playoff = (id: string, round: number, after: string[]): ScheduleMatch => ({
    id: `${divisionId}-${id}`,
    divisionId,
    phase: "PLAYOFF",
    teamIds: [],
    after: after.map((a) => `${divisionId}-${a}`),
    minutes: playoffMinutes,
    round,
  });
  const quarterfinals = ["QF1", "QF2", "QF3", "QF4"].map((id) => playoff(id, 0, []));
  const semifinals = [playoff("SF1", 1, ["QF1", "QF2"]), playoff("SF2", 1, ["QF3", "QF4"])];
  return [...matches, ...quarterfinals, ...semifinals, playoff("F", 2, ["SF1", "SF2"])];
}

// A Montreal Saturday: 8:00 to 21:00 Eastern time (UTC-5 in November).
export const saturday = {
  startsAt: new Date("2027-11-13T13:00Z"),
  endsAt: new Date("2027-11-14T02:00Z"),
};
