// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Suggests a schedule (RALLY-257 spike, story RALLY-83). Pure code, deterministic:
// the same input always gives the same schedule. See docs/architecture/scheduling.md
// for why greedy slotting was picked over a constraint solver.

export type MatchPhase = "POOL" | "PLAYOFF";

export type ScheduleMatch = {
  id: string;
  divisionId: string;
  phase: MatchPhase;
  // The teams, when known. Playoff matches have none until the pools finish.
  teamIds: string[];
  // Matches that must end first, e.g. a semifinal waits for its quarterfinals.
  after: string[];
  // How long the court is booked (estimateMatchMinutes).
  minutes: number;
  // The round inside the pool or the playoffs. Lower rounds go first.
  round: number;
};

export type ScheduleInput = {
  startsAt: Date;
  endsAt: Date;
  courts: number;
  // Rest between two matches of the same team. 0 means no rest required.
  minRestMinutes: number;
  matches: ScheduleMatch[];
};

export type ScheduleSlot = { matchId: string; court: number; startsAt: Date; endsAt: Date };

export type Unscheduled = { matchId: string; reason: string };

export type ScheduleResult = { slots: ScheduleSlot[]; unscheduled: Unscheduled[] };

const MINUTE = 60_000;

const phaseRank = (phase: MatchPhase) => (phase === "POOL" ? 0 : 1);

// Pools before playoffs: a playoff match waits for every pool match of its division.
function prerequisites(input: ScheduleInput): Map<string, string[]> {
  const poolIdsByDivision = new Map<string, string[]>();
  for (const match of input.matches)
    if (match.phase === "POOL")
      poolIdsByDivision.set(match.divisionId, [
        ...(poolIdsByDivision.get(match.divisionId) ?? []),
        match.id,
      ]);
  return new Map(
    input.matches.map((match) => [
      match.id,
      match.phase === "PLAYOFF"
        ? [...match.after, ...(poolIdsByDivision.get(match.divisionId) ?? [])]
        : match.after,
    ]),
  );
}

// What the scheduler knows so far. Times are minutes from the tournament start.
type State = {
  input: ScheduleInput;
  before: Map<string, string[]>;
  courtFree: number[];
  teamFree: Map<string, number>;
  ended: Map<string, number>;
  failed: Set<string>;
  remaining: ScheduleMatch[];
  result: ScheduleResult;
};

// The earliest minute a match can start, or null while a match it waits for isn't placed.
function readyAt(state: State, match: ScheduleMatch): number | null {
  const rest = state.input.minRestMinutes;
  let ready = 0;
  for (const id of state.before.get(match.id) ?? []) {
    const end = state.ended.get(id);
    if (end === undefined) return null;
    ready = Math.max(ready, end + rest);
  }
  for (const team of match.teamIds) {
    const free = state.teamFree.get(team);
    if (free !== undefined) ready = Math.max(ready, free + rest);
  }
  return ready;
}

// Pools first, then lower rounds, then the teams that have waited longest.
function moreUrgent(state: State, a: ScheduleMatch, b: ScheduleMatch): boolean {
  const urgency = (match: ScheduleMatch) => [
    phaseRank(match.phase),
    match.round,
    Math.max(-1, ...match.teamIds.map((team) => state.teamFree.get(team) ?? -1)),
  ];
  const [x, y] = [urgency(a), urgency(b)];
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return a.id < b.id;
}

function drop(state: State, match: ScheduleMatch, reason: string) {
  state.result.unscheduled.push({ matchId: match.id, reason });
  state.failed.add(match.id);
  state.remaining.splice(state.remaining.indexOf(match), 1);
}

function place(state: State, match: ScheduleMatch, court: number, start: number) {
  const end = start + match.minutes;
  const at = (minutes: number) => new Date(state.input.startsAt.getTime() + minutes * MINUTE);
  state.result.slots.push({
    matchId: match.id,
    court: court + 1,
    startsAt: at(start),
    endsAt: at(end),
  });
  state.courtFree[court] = end;
  state.ended.set(match.id, end);
  for (const team of match.teamIds) state.teamFree.set(team, end);
  state.remaining.splice(state.remaining.indexOf(match), 1);
}

// Fills the court that frees up first: places a match, drops one, or makes the
// court wait. Returns false when nothing more can be done.
function step(state: State, length: number): boolean {
  // A match waiting for one that doesn't fit can't be placed either.
  const blocked = state.remaining.find((m) =>
    (state.before.get(m.id) ?? []).some((id) => state.failed.has(id)),
  );
  if (blocked) {
    drop(state, blocked, "It waits for a match that doesn't fit.");
    return true;
  }

  const court = state.courtFree.indexOf(Math.min(...state.courtFree));
  const now = state.courtFree[court];
  let next: ScheduleMatch | null = null;
  let soonest = Infinity;
  for (const match of state.remaining) {
    const ready = readyAt(state, match);
    if (ready === null) continue;
    if (ready <= now && (next === null || moreUrgent(state, match, next))) next = match;
    soonest = Math.min(soonest, ready);
  }

  if (next !== null) {
    // `now` is the earliest any court is free, so a match that doesn't fit now never will.
    if (now + next.minutes > length)
      drop(state, next, "It doesn't fit before the tournament ends.");
    else place(state, next, court, now);
    return true;
  }
  if (soonest !== Infinity) {
    state.courtFree[court] = soonest;
    return true;
  }
  // Every remaining match waits on another in a loop: bad input, not a full day.
  for (const match of [...state.remaining]) drop(state, match, "Its matches wait for each other.");
  return false;
}

// Greedy slotting: take the court that frees up first, and put on it the most
// urgent match that can start then. A match can start when its teams have rested
// and the matches it waits for have ended. If nothing can start, the court waits
// for the next match that can.
export function generateSchedule(input: ScheduleInput): ScheduleResult {
  const length = (input.endsAt.getTime() - input.startsAt.getTime()) / MINUTE;
  const state: State = {
    input,
    before: prerequisites(input),
    courtFree: Array.from({ length: input.courts }, () => 0),
    teamFree: new Map(),
    ended: new Map(),
    failed: new Set(),
    remaining: [...input.matches],
    result: { slots: [], unscheduled: [] },
  };
  while (state.remaining.length > 0 && step(state, length));
  state.result.slots.sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.court - b.court,
  );
  return state.result;
}
