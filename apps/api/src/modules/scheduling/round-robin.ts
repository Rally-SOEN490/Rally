// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Pool matchups for the scheduling prototype. The pools and cross-pools spike
// (RALLY-256, #361) owns how matchups are really made. This stand-in is only here
// so the scheduler has pool matches to place.

// Circle method: one team stays put and the others rotate, so every team plays
// every other team once, and a team plays at most once per round. With an odd
// number of teams, one team sits out each round.
export function roundRobin(teamIds: string[]): Array<Array<[string, string]>> {
  const teams: Array<string | null> = [...teamIds];
  if (teams.length % 2 === 1) teams.push(null);
  const rounds: Array<Array<[string, string]>> = [];
  for (let round = 0; round < teams.length - 1; round++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < teams.length / 2; i++) {
      const home = teams[i];
      const away = teams[teams.length - 1 - i];
      if (home !== null && away !== null) pairs.push([home, away]);
    }
    rounds.push(pairs);
    // Keep the first team in place and rotate the rest by one.
    teams.splice(1, 0, teams.pop() as string | null);
  }
  return rounds;
}
