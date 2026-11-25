// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Checks a schedule against the rules (stories RALLY-216 and RALLY-217). The
// organizer can save a draft with problems, but an ERROR blocks publishing. A
// WARNING (rest time) only asks the organizer to confirm.

import type { ScheduleInput, ScheduleSlot } from "./generate.ts";

export type ScheduleProblem = {
  severity: "ERROR" | "WARNING";
  matchIds: string[];
  message: string;
};

const overlaps = (a: ScheduleSlot, b: ScheduleSlot) =>
  a.startsAt < b.endsAt && b.startsAt < a.endsAt;

const minutesBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / 60_000;

const error = (matchIds: string[], message: string): ScheduleProblem => ({
  severity: "ERROR",
  matchIds,
  message,
});

// Problems with one match on its own: its court, its times, what it waits for.
function slotProblems(
  input: ScheduleInput,
  slot: ScheduleSlot,
  slotOf: Map<string, ScheduleSlot>,
): ScheduleProblem[] {
  const problems: ScheduleProblem[] = [];
  if (slot.court < 1 || slot.court > input.courts)
    problems.push(error([slot.matchId], `Court ${slot.court} doesn't exist.`));
  if (slot.startsAt < input.startsAt || slot.endsAt > input.endsAt)
    problems.push(error([slot.matchId], "The match is outside the tournament's times."));

  const match = input.matches.find((m) => m.id === slot.matchId);
  const pools = input.matches.filter(
    (other) =>
      match?.phase === "PLAYOFF" && other.phase === "POOL" && other.divisionId === match.divisionId,
  );
  for (const id of [...(match?.after ?? []), ...pools.map((m) => m.id)]) {
    const earlier = slotOf.get(id);
    if (earlier && earlier.endsAt > slot.startsAt)
      problems.push(
        error([slot.matchId, id], "The match starts before a match it waits for has ended."),
      );
  }
  return problems;
}

// Problems between two matches: the same court or the same team.
function pairProblems(
  input: ScheduleInput,
  a: ScheduleSlot,
  b: ScheduleSlot,
  teamsOf: Map<string, string[]>,
): ScheduleProblem[] {
  const ids = [a.matchId, b.matchId];
  const problems: ScheduleProblem[] = [];
  if (a.court === b.court && overlaps(a, b))
    problems.push(error(ids, `Court ${a.court} is double-booked.`));

  const teamsA = teamsOf.get(a.matchId) ?? [];
  if (!(teamsOf.get(b.matchId) ?? []).some((team) => teamsA.includes(team))) return problems;
  if (overlaps(a, b)) return [...problems, error(ids, "A team plays two matches at once.")];

  const [first, second] = a.startsAt < b.startsAt ? [a, b] : [b, a];
  if (minutesBetween(first.endsAt, second.startsAt) < input.minRestMinutes)
    problems.push({
      severity: "WARNING",
      matchIds: ids,
      message: `A team rests less than ${input.minRestMinutes} minutes.`,
    });
  return problems;
}

export function scheduleProblems(input: ScheduleInput, slots: ScheduleSlot[]): ScheduleProblem[] {
  const slotOf = new Map(slots.map((slot) => [slot.matchId, slot]));
  const teamsOf = new Map(input.matches.map((match) => [match.id, match.teamIds]));
  const problems = slots.flatMap((slot) => slotProblems(input, slot, slotOf));
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++)
      problems.push(...pairProblems(input, slots[i], slots[j], teamsOf));
  return problems;
}

export const canPublish = (problems: ScheduleProblem[]) =>
  problems.every((problem) => problem.severity !== "ERROR");
