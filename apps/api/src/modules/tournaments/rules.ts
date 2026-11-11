// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// The tournament rules, as plain code so they can be tested on their own.

export type TournamentDates = {
  startsAt: Date | null;
  endsAt: Date | null;
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
};

export type PublishCandidate = TournamentDates & {
  location: string | null;
  courts: number | null;
  divisionCount: number;
};

// True when either date is missing, so a draft is only checked on what it has.
const before = (first: Date | null, second: Date | null) =>
  !first || !second || first.getTime() < second.getTime();
const notAfter = (first: Date | null, second: Date | null) =>
  !first || !second || first.getTime() <= second.getTime();

// Problems with the dates that are filled in. A draft may leave some empty.
// Registration may open and close up to the moment the tournament starts.
export const dateProblems = (dates: TournamentDates) => {
  const problems: string[] = [];
  if (!before(dates.startsAt, dates.endsAt)) problems.push("The end must be after the start.");
  if (!before(dates.registrationOpensAt, dates.registrationClosesAt))
    problems.push("Registration must open before it closes.");
  if (!notAfter(dates.registrationOpensAt, dates.startsAt))
    problems.push("Registration must open before or when the tournament starts.");
  if (!notAfter(dates.registrationClosesAt, dates.startsAt))
    problems.push("Registration must close before or when the tournament starts.");
  return problems;
};

const requiredForPublishing: [keyof PublishCandidate, string][] = [
  ["location", "a location"],
  ["courts", "the number of courts"],
  ["startsAt", "the start date and time"],
  ["endsAt", "the end date and time"],
  ["registrationOpensAt", "when registration opens"],
  ["registrationClosesAt", "when registration closes"],
];

// Everything that stops a draft from being published, as sentences for the organizer.
export const publishProblems = (tournament: PublishCandidate, now: Date) => {
  const missing = requiredForPublishing
    .filter(([field]) => tournament[field] === null)
    .map(([, label]) => label);
  const problems = missing.length > 0 ? [`Add ${missing.join(", ")}.`] : [];
  problems.push(...dateProblems(tournament));
  if (tournament.startsAt && tournament.startsAt.getTime() <= now.getTime())
    problems.push("The tournament must start in the future.");
  if (tournament.divisionCount === 0) problems.push("Add at least one division.");
  return problems;
};

// Whether teams can sign up right now, so the app never has to compare
// Montreal times with the phone's clock. Publishing needs both registration
// dates, so only a draft can be missing one; it counts as NOT_OPEN, and the app
// checks the dates itself to show "Sign-up dates to be announced".
export type SignUps = "NOT_OPEN" | "OPEN" | "CLOSED";

export const signUpsAt = (
  dates: Pick<TournamentDates, "registrationOpensAt" | "registrationClosesAt">,
  now: Date,
): SignUps => {
  const { registrationOpensAt: opens, registrationClosesAt: closes } = dates;
  if (!opens || !closes || now < opens) return "NOT_OPEN";
  return now < closes ? "OPEN" : "CLOSED";
};
