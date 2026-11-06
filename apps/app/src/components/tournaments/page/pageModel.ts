// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { formatPrice } from "@/lib/organizer-tournaments";
import { shortDate } from "@/lib/tournament-dates";
import { summarizeDivisions, type BrowseDivision, type TournamentPage } from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";

// What the tournament page shows in each case, kept apart from the layout so
// every case is easy to test.

const copy = tournamentCopy.page;

// "$240 / team", or "Free".
export const pricePerTeam = (cents: number) =>
  cents === 0 ? copy.free : copy.pricePerTeam(formatPrice(cents));

export const spotsLeftIn = (division: BrowseDivision) =>
  Math.max(0, division.maxTeams - division.registeredTeams);

// The sign-ups row of the info card: when they open or close, and the other date.
export function signUpsRow(page: TournamentPage) {
  const { registrationOpensAt: opens, registrationClosesAt: closes } = page;
  if (!opens || !closes) return { title: copy.signUpsNotSet };
  switch (page.signUps) {
    case "NOT_OPEN":
      return {
        title: copy.signUpsOpen(shortDate(opens)),
        detail: copy.signUpsCloseLater(shortDate(closes)),
      };
    case "OPEN":
      return {
        title: copy.signUpsClose(shortDate(closes)),
        detail: copy.signUpsOpened(shortDate(opens)),
      };
    case "CLOSED":
      return {
        title: copy.signUpsClosed(shortDate(closes)),
        detail: copy.signUpsOpened(shortDate(opens)),
      };
  }
}

export type BottomBar =
  { kind: "signUp"; spotsLeft: number } | { kind: "message"; text: string } | { kind: "draft" };

// The bar docked at the bottom. A player can sign up only while sign-ups are
// open and a division has room; otherwise the bar only says why. The organizer
// sees where sign-ups stand, or that it is still a draft.
export function bottomBar(page: TournamentPage): BottomBar {
  if (page.isOrganizer && page.status === "DRAFT") return { kind: "draft" };
  const closes = page.registrationClosesAt;
  const opens = page.registrationOpensAt;
  if (page.signUps === "NOT_OPEN")
    return {
      kind: "message",
      text: opens ? copy.signUpsOpen(shortDate(opens)) : copy.signUpsNotSet,
    };
  if (page.signUps === "CLOSED")
    return {
      kind: "message",
      text: closes ? copy.signUpsClosed(shortDate(closes)) : copy.signUpsNotSet,
    };
  if (page.isOrganizer) return { kind: "message", text: copy.signUpsOpenNow };
  const { spotsLeft } = summarizeDivisions(page.divisions);
  return spotsLeft > 0 ? { kind: "signUp", spotsLeft } : { kind: "message", text: copy.full };
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
