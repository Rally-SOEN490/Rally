// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { expect, test } from "vitest";
import { fromMontrealTime, toMontrealTime } from "../src/modules/tournaments/montreal-time.ts";

test.each([
  ["winter (UTC-5)", "2026-11-15T09:00", "2026-11-15T14:00:00.000Z"],
  ["summer (UTC-4)", "2026-07-01T12:00", "2026-07-01T16:00:00.000Z"],
  ["midnight", "2027-01-01T00:00", "2027-01-01T05:00:00.000Z"],
  ["the first minute after clocks spring forward", "2026-03-08T03:00", "2026-03-08T07:00:00.000Z"],
  ["the first 1:30 when clocks fall back", "2026-11-01T01:30", "2026-11-01T05:30:00.000Z"],
  ["the hour after clocks fall back", "2026-11-01T02:00", "2026-11-01T07:00:00.000Z"],
])("reads a Montreal time in %s", (_, local, utc) => {
  expect(fromMontrealTime(local)?.toISOString()).toBe(utc);
});

test.each([
  ["a time skipped when clocks spring forward", "2026-03-08T02:30"],
  ["February 30", "2026-02-30T09:00"],
  ["month 13", "2026-13-01T09:00"],
  ["hour 24", "2026-11-15T24:00"],
  ["a time with seconds", "2026-11-15T09:00:00"],
  ["a date without a time", "2026-11-15"],
])("rejects %s", (_, local) => {
  expect(fromMontrealTime(local)).toBeNull();
});

test("writes a moment back as Montreal time, whatever the server's time zone", () => {
  expect(toMontrealTime(new Date("2026-11-15T14:00:00Z"))).toBe("2026-11-15T09:00");
  expect(toMontrealTime(new Date("2026-07-01T03:30:00Z"))).toBe("2026-06-30T23:30");
});
