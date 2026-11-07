// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Tournament times are Montreal times: "9:00" means 9:00 in Montreal for
// everyone, whatever their phone's time zone. The API reads and writes them as
// "YYYY-MM-DDTHH:mm" in Montreal; the database stores the exact moment (UTC).

export const MONTREAL = "America/Montreal";
export const localDateTimePattern = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MONTREAL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// The Montreal wall-clock time at a moment, as "YYYY-MM-DDTHH:mm".
export const toMontrealTime = (moment: Date) => {
  const part = Object.fromEntries(
    formatter.formatToParts(moment).map(({ type, value }) => [type, value]),
  );
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`;
};

// How far Montreal is from UTC at a moment, in milliseconds (-4 or -5 hours).
const offsetAt = (moment: number) =>
  Date.parse(`${toMontrealTime(new Date(moment))}:00Z`) - Math.floor(moment / 60_000) * 60_000;

// The moment a Montreal wall-clock time happens, or null if it doesn't exist:
// an invalid date like February 30, or a time skipped when clocks spring forward
// (2:00 to 3:00 one night in March). In the hour repeated when clocks fall back
// in November, it returns the first one.
export const fromMontrealTime = (local: string): Date | null => {
  if (!new RegExp(localDateTimePattern).test(local)) return null;
  const asIfUtc = Date.parse(`${local}:00Z`);
  if (Number.isNaN(asIfUtc)) return null;
  let moment = asIfUtc - offsetAt(asIfUtc);
  const offset = offsetAt(moment);
  if (offset !== asIfUtc - moment) moment = asIfUtc - offset;
  // Rejects times that don't exist, and dates JavaScript rolled over (Feb 30 → Mar 2).
  return toMontrealTime(new Date(moment)) === local ? new Date(moment) : null;
};
