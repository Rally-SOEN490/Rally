// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { expect, test } from "vitest";
import { dateProblems, publishProblems } from "../src/modules/tournaments/rules.ts";

const at = (iso: string) => new Date(iso);
const valid = {
  startsAt: at("2027-11-15T14:00Z"),
  endsAt: at("2027-11-16T00:00Z"),
  registrationOpensAt: at("2027-10-20T16:00Z"),
  registrationClosesAt: at("2027-11-10T04:59Z"),
};
const ready = { ...valid, location: "Verdun", courts: 3, divisionCount: 1 };
const now = at("2026-11-05T12:00Z");

test("accepts dates in the right order", () => {
  expect(dateProblems(valid)).toEqual([]);
});

test("checks only the dates that are filled in", () => {
  expect(
    dateProblems({
      startsAt: null,
      endsAt: valid.endsAt,
      registrationOpensAt: null,
      registrationClosesAt: null,
    }),
  ).toEqual([]);
});

test.each([
  [
    "the end is before the start",
    { endsAt: at("2027-11-15T13:00Z") },
    "The end must be after the start.",
  ],
  ["the end equals the start", { endsAt: valid.startsAt }, "The end must be after the start."],
  [
    "registration closes before it opens",
    { registrationClosesAt: at("2027-10-19T00:00Z") },
    "Registration must open before it closes.",
  ],
  [
    "registration closes after the start",
    { registrationClosesAt: at("2027-11-15T15:00Z") },
    "Registration must close before or when the tournament starts.",
  ],
])("finds a problem when %s", (_, change, problem) => {
  expect(dateProblems({ ...valid, ...change })).toContain(problem);
});

test("is ready to publish when everything is complete", () => {
  expect(publishProblems(ready, now)).toEqual([]);
});

test("lists every missing field at once", () => {
  const empty = {
    location: null,
    courts: null,
    startsAt: null,
    endsAt: null,
    registrationOpensAt: null,
    registrationClosesAt: null,
    divisionCount: 0,
  };

  expect(publishProblems(empty, now)).toEqual([
    "Add a location, the number of courts, the start date and time, the end date and time, when registration opens, when registration closes.",
    "Add at least one division.",
  ]);
});

test("needs a start in the future", () => {
  expect(publishProblems({ ...ready, startsAt: now }, now)).toContain(
    "The tournament must start in the future.",
  );
});

test("lets registration close at the very moment the tournament starts", () => {
  expect(dateProblems({ ...valid, registrationClosesAt: valid.startsAt })).toEqual([]);
});

test("lets registration open when the tournament starts, if no closing time is set yet", () => {
  expect(
    dateProblems({ ...valid, registrationOpensAt: valid.startsAt, registrationClosesAt: null }),
  ).toEqual([]);
});

test("finds a problem when registration opens after the start", () => {
  expect(
    dateProblems({
      ...valid,
      registrationOpensAt: at("2027-11-15T15:00Z"),
      registrationClosesAt: null,
    }),
  ).toEqual(["Registration must open before or when the tournament starts."]);
});
