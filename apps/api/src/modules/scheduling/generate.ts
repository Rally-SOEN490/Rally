// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Suggests a schedule (RALLY-257 spike, story RALLY-83). Pure code, deterministic:
// the same input always gives the same schedule. Everything else about the
// tournament is already set when this runs: the matches come from the pools and
// playoffs (#361), and their lengths from the organizer. See
// docs/architecture/scheduling.md for why greedy slotting was picked.

export type MatchPhase = "POOL" | "PLAYOFF";

export type ScheduleMatch = {
  id: string;
  divisionId: string;
  phase: MatchPhase;
  // The teams, when known. Playoff matches have none until the pools finish.
  teamIds: string[];
  // Matches that must end first, e.g. a semifinal waits for its quarterfinals.
  after: string[];
  // How long the court is booked, set by the organizer per stage (e.g. pools 55').
  minutes: number;
  // The round inside the pool or the playoffs. Lower rounds go first.
  round: number;
};

// The hours the courts are available on one day of the tournament.
export type TournamentDay = { startsAt: Date; endsAt: Date };

// TEAMS: a team that isn't playing referees. DEDICATED: the organizer has referees,
// so the schedule doesn't assign any.
export type RefereeMode = "TEAMS" | "DEDICATED";

export type ScheduleInput = {
  days: TournamentDay[];
  courts: number;
  // Rest between two matches of the same team. 0 means no rest required.
  minRestMinutes: number;
  referees: RefereeMode;
  matches: ScheduleMatch[];
};

export type ScheduleSlot = {
  matchId: string;
  court: number;
  startsAt: Date;
  endsAt: Date;
  // Null with dedicated referees, for playoff matches whose teams aren't known yet,
  // or when every other team of the division is busy.
  refereeTeamId: string | null;
};

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

// Every team of each division, in a stable order, for picking referees.
function teamsByDivision(input: ScheduleInput): Map<string, string[]> {
  const teams = new Map<string, Set<string>>();
  for (const match of input.matches)
    for (const team of match.teamIds)
      teams.set(match.divisionId, (teams.get(match.divisionId) ?? new Set()).add(team));
  return new Map([...teams].map(([division, set]) => [division, [...set].sort()]));
}

// What the scheduler knows so far. Times are minutes from the first day's start.
type State = {
  input: ScheduleInput;
  origin: number;
  days: Array<{ start: number; end: number }>;
  before: Map<string, string[]>;
  courtFree: number[];
  // When each team's last match ends.
  teamFree: Map<string, number>;
  ended: Map<string, number>;
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

// Referees are picked after every match is placed, so refereeing never delays a
// match: for each match in time order, a team of the same division that isn't
// playing or refereeing then, with the fewest duties so far.
function assignReferees(input: ScheduleInput, slots: ScheduleSlot[]) {
  if (input.referees === "DEDICATED") return;
  const matches = new Map(input.matches.map((match) => [match.id, match]));
  const divisionTeams = teamsByDivision(input);
  const duties = new Map<string, number>();
  for (const slot of slots) {
    const match = matches.get(slot.matchId);
    if (!match || match.teamIds.length === 0) continue;
    const busy = new Set<string>();
    for (const other of slots)
      if (other.startsAt < slot.endsAt && slot.startsAt < other.endsAt) {
        for (const team of matches.get(other.matchId)?.teamIds ?? []) busy.add(team);
        if (other.refereeTeamId !== null) busy.add(other.refereeTeamId);
      }
    const free = (divisionTeams.get(match.divisionId) ?? []).filter((team) => !busy.has(team));
    const count = (team: string) => duties.get(team) ?? 0;
    const referee = free.reduce<string | null>(
      (best, team) => (best === null || count(team) < count(best) ? team : best),
      null,
    );
    slot.refereeTeamId = referee;
    if (referee !== null) duties.set(referee, count(referee) + 1);
  }
}

function place(state: State, match: ScheduleMatch, court: number, start: number) {
  const end = start + match.minutes;
  const at = (minutes: number) => new Date(state.origin + minutes * MINUTE);
  state.result.slots.push({
    matchId: match.id,
    court: court + 1,
    startsAt: at(start),
    endsAt: at(end),
    refereeTeamId: null,
  });
  state.courtFree[court] = end;
  state.ended.set(match.id, end);
  for (const team of match.teamIds) state.teamFree.set(team, end);
  state.remaining.splice(state.remaining.indexOf(match), 1);
}

function dropAll(state: State, reason: string) {
  for (const match of state.remaining) state.result.unscheduled.push({ matchId: match.id, reason });
  state.remaining = [];
}

// Fills the court that frees up first: places a match, or moves the court's time
// forward (to the next match that can start, or to the next day). Returns false
// when nothing more can be done.
function step(state: State): boolean {
  const court = state.courtFree.indexOf(Math.min(...state.courtFree));
  const now = state.courtFree[court];
  const day = state.days.find((d) => now < d.end);
  if (!day) {
    dropAll(state, "It doesn't fit in the tournament's days.");
    return false;
  }
  if (now < day.start) {
    state.courtFree[court] = day.start;
    return true;
  }

  let next: ScheduleMatch | null = null;
  let soonest = Infinity;
  for (const match of state.remaining) {
    const ready = readyAt(state, match);
    if (ready === null) continue;
    if (ready <= now && (next === null || moreUrgent(state, match, next))) next = match;
    soonest = Math.min(soonest, ready);
  }

  if (next !== null) {
    // Too late in the day for the most urgent match: close this court until tomorrow.
    if (now + next.minutes > day.end) state.courtFree[court] = day.end;
    else place(state, next, court, now);
    return true;
  }
  if (soonest !== Infinity) {
    state.courtFree[court] = soonest;
    return true;
  }
  // Every remaining match waits on another in a loop: bad input, not a full day.
  dropAll(state, "Its matches wait for each other.");
  return false;
}

// Greedy slotting: take the court that frees up first, and put on it the most
// urgent match that can start then. A match can start when its teams have rested
// and the matches it waits for have ended. If nothing can start, the court waits
// for the next match that can. Courts close at the end of each day. Referees are
// added at the end.
export function generateSchedule(input: ScheduleInput): ScheduleResult {
  const origin = Math.min(...input.days.map((day) => day.startsAt.getTime()));
  const state: State = {
    input,
    origin,
    days: input.days
      .map((day) => ({
        start: (day.startsAt.getTime() - origin) / MINUTE,
        end: (day.endsAt.getTime() - origin) / MINUTE,
      }))
      .sort((a, b) => a.start - b.start),
    before: prerequisites(input),
    courtFree: Array.from({ length: input.courts }, () => 0),
    teamFree: new Map(),
    ended: new Map(),
    remaining: [...input.matches],
    result: { slots: [], unscheduled: [] },
  };
  while (state.remaining.length > 0 && step(state));
  state.result.slots.sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.court - b.court,
  );
  assignReferees(input, state.result.slots);
  return state.result;
}
