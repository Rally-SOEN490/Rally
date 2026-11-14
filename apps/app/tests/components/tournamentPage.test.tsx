// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import { TournamentPageScreen } from "@/components/tournaments/page/tournamentPageScreen";
import { ApiError } from "@/lib/api";
import {
  getTournamentPage,
  signUpTeam,
  type BrowseDivision,
  type TournamentPage,
} from "@/lib/tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/tournaments", () => ({
  ...jest.requireActual("@/lib/tournaments"),
  getTournamentPage: jest.fn(),
  signUpTeam: jest.fn(),
}));

const division = (overrides: Partial<BrowseDivision>): BrowseDivision => ({
  id: "d1",
  name: "6v6 Co-ed B",
  format: "6v6",
  type: "coed",
  levels: ["B"],
  maxTeams: 15,
  priceCents: 24000,
  registeredTeams: 0,
  ...overrides,
});

const description = "The best 6s day of the year is back! 🏐\n\nWhat's included:\n  • 3 pool games";

// What a player gets: sign-ups open, two divisions, one of them full.
const forPlayer: TournamentPage = {
  id: "t1",
  name: "Verdun Winter Cup",
  location: "Verdun Auditorium",
  description,
  startsAt: "2027-11-15T09:00",
  endsAt: "2027-11-15T19:00",
  registrationOpensAt: "2027-10-20T12:00",
  registrationClosesAt: "2027-11-09T23:59",
  organizerName: "Maya Tremblay",
  divisions: [
    division({}),
    division({ id: "d2", name: "6v6 Co-ed A", maxTeams: 8, registeredTeams: 8 }),
  ],
  isOrganizer: false,
  signUps: "OPEN",
  myTeam: null,
};

// What its organizer gets.
const forOrganizer: TournamentPage = {
  ...forPlayer,
  isOrganizer: true,
  status: "PUBLISHED",
  courts: 3,
  publishedAt: "2027-10-01T12:00:00.000Z",
  registeredTeams: 8,
};

const show = async (page: TournamentPage) => {
  jest.mocked(getTournamentPage).mockResolvedValue(page);
  await render(<TournamentPageScreen id={page.id} />);
  await screen.findByRole("header", { name: page.name });
};

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: {} as User }));
  jest.mocked(getTournamentPage).mockReset();
  jest.mocked(signUpTeam).mockReset();
  jest.mocked(router.canGoBack).mockReturnValue(true);
});

// ---------- What a player sees ----------

it("shows the details, the description as typed and the divisions", async () => {
  await show(forPlayer);

  expect(screen.getByText("by Maya Tremblay")).toBeOnTheScreen();
  expect(screen.getByText("Mon, Nov 15, 2027")).toBeOnTheScreen();
  expect(screen.getByText("9:00 AM – 7:00 PM")).toBeOnTheScreen();
  expect(screen.getByText("Verdun Auditorium")).toBeOnTheScreen();
  expect(screen.getByText("Sign-ups close Nov 9")).toBeOnTheScreen();
  expect(screen.getByText("Opened Oct 20")).toBeOnTheScreen();
  expect(screen.getByText(description)).toBeOnTheScreen();
  expect(screen.getByRole("header", { name: "Divisions" })).toBeOnTheScreen();
  expect(screen.getByText("$240 · 15 spots left")).toBeOnTheScreen();
  expect(screen.getByText("$240 · Full")).toBeOnTheScreen();
  expect(screen.getByText("15 spots left")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Sign up" })).toBeOnTheScreen();
  expect(screen.queryByText("Registered teams")).not.toBeOnTheScreen();
});

it("shows a single division as a row, with its teams count", async () => {
  await show({ ...forPlayer, divisions: [division({ priceCents: 0 })] });

  expect(screen.getByText("6v6 Co-ed B · Free")).toBeOnTheScreen();
  expect(screen.getByRole("header", { name: "Teams · 0 / 15" })).toBeOnTheScreen();
  expect(screen.queryByRole("header", { name: "Divisions" })).not.toBeOnTheScreen();
});

it("leaves out About when there is no description", async () => {
  await show({ ...forPlayer, description: null });

  expect(screen.queryByRole("header", { name: "About" })).not.toBeOnTheScreen();
});

it("shows a tournament that ends another day", async () => {
  await show({ ...forPlayer, endsAt: "2027-11-16T17:00" });

  expect(screen.getByText("9:00 AM – Nov 16, 5:00 PM")).toBeOnTheScreen();
});

it.each([
  ["before they open", "NOT_OPEN", "Sign-ups open Oct 20", "Close Nov 9"],
  ["after they close", "CLOSED", "Sign-ups closed Nov 9", "Opened Oct 20"],
] as const)("says why sign-ups aren't possible %s", async (_, signUps, reason, detail) => {
  await show({ ...forPlayer, signUps });

  // Once in the info card and once in the bar.
  expect(screen.getAllByText(reason)).toHaveLength(2);
  expect(screen.getByText(detail)).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Sign up" })).not.toBeOnTheScreen();
});

it("says the tournament is full when no division has room", async () => {
  await show({ ...forPlayer, divisions: [division({ registeredTeams: 15 })] });

  expect(screen.getByText("Full")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Sign up" })).not.toBeOnTheScreen();
});

it("shows the viewer's team instead of Sign up", async () => {
  const myTeam = {
    id: "team1",
    name: "Spike Lee",
    divisionId: "d1",
    divisionName: "6v6 Co-ed B",
    isCaptain: true,
  };
  await show({ ...forPlayer, myTeam });

  expect(screen.getByText("You're captain of Spike Lee")).toBeOnTheScreen();
  // Its division under it, besides the Divisions list.
  expect(screen.getAllByText("6v6 Co-ed B")).toHaveLength(2);
  expect(screen.queryByRole("button", { name: "Sign up" })).not.toBeOnTheScreen();
});

it("shows the viewer's team after sign-ups close too", async () => {
  const myTeam = {
    id: "team1",
    name: "Spike Lee",
    divisionId: "d1",
    divisionName: "6v6 Co-ed B",
    isCaptain: false,
  };
  await show({ ...forPlayer, signUps: "CLOSED", myTeam });

  expect(screen.getByText("You're on Spike Lee")).toBeOnTheScreen();
  expect(screen.getAllByText("Sign-ups closed Nov 9")).toHaveLength(1);
});

// ---------- What the organizer sees ----------

it("shows the organizer the teams of each division, and lets them sign up a team", async () => {
  await show(forOrganizer);

  expect(screen.getByText("$240 · 0 / 15 teams")).toBeOnTheScreen();
  expect(screen.getByText("Full · 8 / 8")).toBeOnTheScreen();
  expect(screen.getByText("8 / 23 teams")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Sign up" })).toBeOnTheScreen();
});

it("shows Registered teams greyed out until the list exists", async () => {
  await show(forOrganizer);

  expect(screen.getByRole("button", { name: "Registered teams" })).toBeDisabled();
  expect(screen.getByText("The list of teams is coming soon")).toBeOnTheScreen();
});

it("offers to continue setting up a draft", async () => {
  await show({ ...forOrganizer, status: "DRAFT", signUps: "NOT_OPEN" });

  expect(screen.getByText("Draft · only you can see it")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Continue setup" }));
  expect(router.push).toHaveBeenCalledWith("/tournaments/t1/setup");
});

it("shows what's still missing from a bare draft", async () => {
  await show({
    ...forOrganizer,
    status: "DRAFT",
    signUps: "NOT_OPEN",
    location: null,
    description: null,
    startsAt: null,
    endsAt: null,
    registrationOpensAt: null,
    registrationClosesAt: null,
    divisions: [],
  });

  expect(screen.getByText("Dates to be announced")).toBeOnTheScreen();
  expect(screen.getByText("Location to be announced")).toBeOnTheScreen();
  expect(screen.getByText("Sign-up dates to be announced")).toBeOnTheScreen();
  expect(screen.queryByRole("header", { name: "Divisions" })).not.toBeOnTheScreen();
});

// ---------- Loading, failing and leaving ----------

it("shows that it's loading", async () => {
  jest.mocked(getTournamentPage).mockReturnValue(new Promise(() => {}));
  await render(<TournamentPageScreen id="t1" />);

  expect(screen.getByText("Loading the tournament…")).toBeOnTheScreen();
});

it("offers to try again when it can't load", async () => {
  jest
    .mocked(getTournamentPage)
    .mockRejectedValueOnce(new ApiError(503, "Can't reach the Rally server."))
    .mockResolvedValueOnce(forPlayer);
  await render(<TournamentPageScreen id="t1" />);

  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("header", { name: "Verdun Winter Cup" })).toBeOnTheScreen();
});

it("doesn't offer to try again for a tournament that doesn't exist", async () => {
  jest.mocked(getTournamentPage).mockRejectedValue(new ApiError(404, "Tournament not found."));
  await render(<TournamentPageScreen id="t1" />);

  expect(await screen.findByText("Tournament not found.")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Try again" })).not.toBeOnTheScreen();
});

it("goes back where it came from, or to Search when opened directly", async () => {
  await show(forPlayer);
  await userEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.back).toHaveBeenCalled();

  jest.mocked(router.canGoBack).mockReturnValue(false);
  await userEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.replace).toHaveBeenCalledWith("/search");
});
