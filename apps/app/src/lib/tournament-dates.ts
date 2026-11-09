// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { dateParts, formatTime } from "@/lib/organizer-tournaments";
import { searchCopy } from "@/translations/search.en";

// Tournament times are Montreal times, "YYYY-MM-DDTHH:mm". These read them as
// written and never convert them to the phone's time zone. Day and month names
// are in English, like the rest of the app's text, whatever the phone's
// language, so a date never mixes two languages.

// The date at noon UTC, so naming its weekday can't shift it by a day.
const asCalendarDay = (value: string) => {
  const { year, day } = dateParts(value);
  const date = new Date(Date.UTC(year, Number(value.slice(5, 7)) - 1, day, 12));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const named = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString("en-CA", { ...options, timeZone: "UTC" });

// The day, month and date, for a date tile: "Sat", "Nov", 15.
export function dateTile(value: string | null) {
  const date = value ? asCalendarDay(value) : undefined;
  if (!value || !date) return undefined;
  return {
    day: named(date, { weekday: "short" }),
    month: named(date, { month: "short" }),
    date: dateParts(value).day,
  };
}

// "Sat, Nov 15, 2026".
export function longDate(value: string) {
  const date = asCalendarDay(value);
  const { year, month, day } = dateParts(value);
  return date ? `${named(date, { weekday: "short" })}, ${month} ${day}, ${year}` : undefined;
}

// "Nov 12".
export function shortDate(value: string) {
  const { month, day } = dateParts(value);
  return `${month} ${day}`;
}

// "9:00 AM – 7:00 PM", or "9:00 AM – Nov 16, 7:00 PM" when it ends another day.
export function timeRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt || !endsAt) return undefined;
  const start = formatTime(startsAt.slice(11, 16));
  const end = formatTime(endsAt.slice(11, 16));
  if (startsAt.slice(0, 10) === endsAt.slice(0, 10)) return searchCopy.timeRange(start, end);
  return searchCopy.timeRange(start, searchCopy.endsOtherDay(shortDate(endsAt), end));
}
