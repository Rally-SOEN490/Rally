// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { dateTile, longDate, shortDate, timeRange } from "@/lib/tournament-dates";

// Montreal times are read as written, whatever the phone's time zone.

it("names the day of a Montreal date without shifting it", () => {
  expect(longDate("2027-11-15T23:30")).toBe("Mon, Nov 15, 2027");
  expect(longDate("2027-11-15T00:15")).toBe("Mon, Nov 15, 2027");
  expect(dateTile("2027-11-15T09:00")).toEqual({ day: "Mon", month: "Nov", date: 15 });
  expect(dateTile(null)).toBeUndefined();
});

it("shortens a date to its month and day", () => {
  expect(shortDate("2027-11-09T23:59")).toBe("Nov 9");
});

it("shows the hours, and the end's date when it ends another day", () => {
  expect(timeRange("2027-11-15T09:00", "2027-11-15T19:00")).toBe("9:00 AM – 7:00 PM");
  expect(timeRange("2027-11-15T09:00", "2027-11-16T00:30")).toBe("9:00 AM – Nov 16, 12:30 AM");
  expect(timeRange(null, "2027-11-15T19:00")).toBeUndefined();
});
