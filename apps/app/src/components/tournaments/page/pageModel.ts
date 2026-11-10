// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { formatPrice } from "@/lib/organizer-tournaments";
import { shortDate } from "@/lib/tournament-dates";
import {
  summarizeDivisions,
  type BrowseDivision,
  type MyTeam,
  type TournamentPage,
} from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";

// What the tournament page shows in each case, kept apart from the layout so
// every case is easy to test.

const copy = tournamentCopy.page;

// "$240 / team", or "Free".
export const pricePerTeam = (cents: number) =>
  cents === 0 ? copy.free : copy.pricePerTeam(formatPrice(cents));

export const spotsLeftIn = (division: BrowseDivision) =>
  Math.max(0, division.maxTeams - division.registeredTeams);

// Both registration dates, shortened, or undefined while a draft is missing one.
// A published tournament always has both.
const signUpDates = (page: TournamentPage) => {
  const { registrationOpensAt: opens, registrationClosesAt: closes } = page;
  return opens && closes ? { opens: shortDate(opens), closes: shortDate(closes) } : undefined;
};

// The sign-ups row of the info card: when they open or close, and the other date.
export function signUpsRow(page: TournamentPage) {
  const dates = signUpDates(page);
  if (!dates) return { title: copy.signUps.notSet };
  const text = copy.signUps[page.signUps];
  return { title: text.title(dates), detail: text.detail(dates) };
}

export type BottomBar =
  | { kind: "signUp"; spotsLeft: number }
  | { kind: "message"; text: string }
  | { kind: "myTeam"; title: string; detail: string }
  | { kind: "draft" };

// The bar docked at the bottom. Anyone, the organizer included, can sign up a
// team while sign-ups are open and a division has room; otherwise the bar only
// says why. Someone on a team sees it instead, and the organizer of a draft
// sees that it is still a draft.
export function bottomBar(page: TournamentPage): BottomBar {
  if (page.isOrganizer && page.status === "DRAFT") return { kind: "draft" };
  if (page.myTeam) {
    const { name, isCaptain, divisionName } = page.myTeam;
    return {
      kind: "myTeam",
      title: isCaptain ? copy.captainOf(name) : copy.onTeam(name),
      detail: divisionName,
    };
  }
  if (page.signUps !== "OPEN") {
    const dates = signUpDates(page);
    const text = dates ? copy.signUps[page.signUps].title(dates) : copy.signUps.notSet;
    return { kind: "message", text };
  }
  const { spotsLeft } = summarizeDivisions(page.divisions);
  return spotsLeft > 0 ? { kind: "signUp", spotsLeft } : { kind: "message", text: copy.full };
}

// The page once the server confirms a new team: the viewer is on it, and its
// division has one more team.
export function withMyTeam(page: TournamentPage, team: MyTeam): TournamentPage {
  const divisions = page.divisions.map((division) =>
    division.id === team.divisionId
      ? { ...division, registeredTeams: division.registeredTeams + 1 }
      : division,
  );
  return page.isOrganizer
    ? { ...page, myTeam: team, divisions, registeredTeams: page.registeredTeams + 1 }
    : { ...page, myTeam: team, divisions };
}

// A division's second line: "$240 · 5 spots left" or "$240 · Full" for players,
// "$240 · 10 / 15 teams" or "Full · 8 / 8" for the organizer.
export function divisionDetail(division: BrowseDivision, isOrganizer: boolean) {
  const price = formatPrice(division.priceCents);
  const shownPrice = division.priceCents === 0 ? copy.free : price;
  const full = spotsLeftIn(division) === 0;
  if (isOrganizer)
    return full
      ? copy.fullTeams(division.maxTeams)
      : copy.priceAndSpots(shownPrice, copy.teamCount(division.registeredTeams, division.maxTeams));
  return copy.priceAndSpots(shownPrice, full ? copy.full : copy.spotsLeft(spotsLeftIn(division)));
}
