// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import {
  formatDate,
  formatPrice,
  formatTime,
  joinDateTime,
  parsePrice,
  publishTournament,
  splitDateTime,
  suggestDivisionName,
  updateDivision,
} from "@/lib/organizer-tournaments";

jest.mock("react-native", () => ({ Platform: { OS: "web" } }));

const user = { getIdToken: jest.fn().mockResolvedValue("the-token") } as unknown as User;
const types = { coed: "Co-ed", men: "Men", women: "Women" };

beforeEach(() => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ id: "t1" }),
  } as Response);
});

it("suggests a division name from its format, type and levels in order", () => {
  expect(suggestDivisionName("6v6", "coed", ["B+", "B"], types)).toBe("6v6 Co-ed B / B+");
  expect(suggestDivisionName("2v2", "women", [], types)).toBe("2v2 Women");
});

it.each([
  [24000, "$240"],
  [1250, "$12.50"],
  [0, "$0"],
])("shows %i cents as %s", (cents, text) => {
  expect(formatPrice(cents)).toBe(text);
});

it.each([
  ["240", 24000],
  ["$240", 24000],
  [" 12.5 ", 1250],
  ["12.05", 1205],
  ["0", 0],
])("reads the price %j as %i cents", (text, cents) => {
  expect(parsePrice(text)).toBe(cents);
});

it.each(["", "abc", "12.345", "-5", "1,000"])("rejects the price %j", (text) => {
  expect(parsePrice(text)).toBeUndefined();
});

it("splits and joins a Montreal time without converting it", () => {
  expect(splitDateTime("2026-11-15T09:00")).toEqual({ date: "2026-11-15", time: "09:00" });
  expect(splitDateTime(null)).toEqual({ date: null, time: null });
  expect(joinDateTime("2026-11-15", "09:00")).toBe("2026-11-15T09:00");
  expect(joinDateTime("2026-11-15", null)).toBeNull();
});

it.each([
  ["00:00", "12:00 AM"],
  ["09:05", "9:05 AM"],
  ["12:00", "12:00 PM"],
  ["23:59", "11:59 PM"],
])("shows %s as %s", (time, text) => {
  expect(formatTime(time)).toBe(text);
});

it("shows a date as month, day and year", () => {
  expect(formatDate("2026-11-15")).toBe("Nov 15, 2026");
});

it("calls the tournament routes with the organizer's login", async () => {
  await updateDivision(user, "t1", "d1", {
    name: "6v6 Co-ed B",
    format: "6v6",
    type: "coed",
    levels: ["B"],
    maxTeams: 8,
    priceCents: 0,
  });
  await publishTournament(user, "t1");

  expect(jest.mocked(fetch).mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
    ["http://localhost:3000/tournaments/t1/divisions/d1", "PATCH"],
    ["http://localhost:3000/tournaments/t1/publish", "POST"],
  ]);
});
