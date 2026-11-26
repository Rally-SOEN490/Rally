// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { Redirect, router } from "expo-router";
import type { User } from "firebase/auth";
import { DivisionPickerScreen } from "@/components/tournaments/gameSetup/divisionPicker";
import { GameSetupScreen } from "@/components/tournaments/gameSetup/gameSetupScreen";
import { ApiError } from "@/lib/api";
import { getOrganizerPage, type BrowseDivision, type OrganizerPage } from "@/lib/tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
  Redirect: jest.fn(() => null),
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/tournaments", () => ({
  ...jest.requireActual("@/lib/tournaments"),
  getOrganizerPage: jest.fn(),
}));

const division = (overrides: Partial<BrowseDivision>): BrowseDivision => ({
  id: "d1",
  name: "4v4 Co-ed C / C+",
  format: "4v4",
  type: "coed",
  levels: ["C", "C+"],
  maxTeams: 12,
  priceCents: 10000,
  registeredTeams: 12,
  ...overrides,
});

const tournament: OrganizerPage = {
  id: "t1",
  status: "PUBLISHED",
  name: "CKVC Holiday 4s",
  location: "Collège de Maisonneuve",
  courts: 3,
  description: null,
  startsAt: "2027-11-29T12:00",
  endsAt: "2027-11-29T18:00",
  registrationOpensAt: "2027-11-01T12:00",
  registrationClosesAt: "2027-11-15T23:59",
  publishedAt: "2027-10-01T12:00:00.000Z",
  registeredTeams: 13,
  organizerName: "Hoang",
  divisions: [
    division({}),
    division({ id: "d2", name: "4v4 Women's B", levels: ["B"], maxTeams: 8, registeredTeams: 1 }),
  ],
  isOrganizer: true,
  signUps: "CLOSED",
  myTeam: null,
};

const oneDivision: OrganizerPage = { ...tournament, divisions: [division({})] };

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: {} as User }));
  jest.mocked(getOrganizerPage).mockReset();
  jest.mocked(router.canGoBack).mockReturnValue(true);
});

// ---------- Picking a division ----------

const showPicker = async (page: OrganizerPage) => {
  jest.mocked(getOrganizerPage).mockResolvedValue(page);
  await render(<DivisionPickerScreen id="t1" />);
};

it("lists the divisions to pick from", async () => {
  await showPicker(tournament);

  expect(await screen.findByRole("header", { name: "Game set up" })).toBeOnTheScreen();
  expect(screen.getByText("CKVC Holiday 4s · 2 divisions")).toBeOnTheScreen();
  expect(screen.getByText("PICK A DIVISION")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "4v4 Co-ed C / C+, 12 / 12 teams" })).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "4v4 Women's B, 1 / 8 teams" })).toBeOnTheScreen();
  expect(
    screen.getByText("Each division has its own pools, playoffs and schedule."),
  ).toBeOnTheScreen();
});

it("opens the division picked", async () => {
  await showPicker(tournament);

  await userEvent.press(await screen.findByRole("button", { name: /4v4 Women's B/ }));
  expect(router.push).toHaveBeenCalledWith("/tournaments/t1/game-setup/d2");
});

it("skips the list when there is only one division", async () => {
  await showPicker(oneDivision);

  await waitFor(() => expect(Redirect).toHaveBeenCalled());
  expect(jest.mocked(Redirect).mock.calls[0][0]).toEqual({
    href: "/tournaments/t1/game-setup/d1",
  });
  expect(screen.queryByText("PICK A DIVISION")).not.toBeOnTheScreen();
});

it("says when there is no division to set up yet", async () => {
  await showPicker({ ...tournament, status: "DRAFT", divisions: [] });

  expect(
    await screen.findByText("This tournament has no divisions yet. Add one in its setup first."),
  ).toBeOnTheScreen();
  expect(screen.queryByText("PICK A DIVISION")).not.toBeOnTheScreen();
});

it("doesn't let anyone else in", async () => {
  jest.mocked(getOrganizerPage).mockRejectedValue(new ApiError(404, "Tournament not found."));
  await render(<DivisionPickerScreen id="t1" />);

  expect(await screen.findByText("Tournament not found.")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Try again" })).not.toBeOnTheScreen();
});

it("offers to try again when it can't load", async () => {
  jest
    .mocked(getOrganizerPage)
    .mockRejectedValueOnce(new ApiError(503, "Can't reach the Rally server."))
    .mockResolvedValueOnce(tournament);
  await render(<DivisionPickerScreen id="t1" />);

  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("PICK A DIVISION")).toBeOnTheScreen();
});

it("goes back to the tournament's page when opened directly", async () => {
  await showPicker(tournament);
  jest.mocked(router.canGoBack).mockReturnValue(false);

  await userEvent.press(await screen.findByRole("button", { name: "Back" }));
  expect(router.replace).toHaveBeenCalledWith("/tournaments/t1");
});

// ---------- A division's Game set up ----------

const showDivision = async (page: OrganizerPage, divisionId = "d1") => {
  jest.mocked(getOrganizerPage).mockResolvedValue(page);
  await render(<GameSetupScreen id="t1" divisionId={divisionId} />);
  await screen.findByRole("header", { name: "Game set up" });
};

it("shows the division, opened on Pools", async () => {
  await showDivision(tournament);

  expect(screen.getByText("CKVC Holiday 4s")).toBeOnTheScreen();
  expect(screen.getByRole("header", { name: "4v4 Co-ed C / C+" })).toBeOnTheScreen();
  expect(screen.getByText("12 teams registered")).toBeOnTheScreen();
  expect(screen.getByRole("tab", { name: "Pools" })).toBeSelected();
  expect(screen.getByRole("tab", { name: "Playoffs" })).not.toBeSelected();
  expect(screen.getByRole("tab", { name: "Schedule" })).not.toBeSelected();
  expect(screen.getByText("Pools are coming soon")).toBeOnTheScreen();
});

it("switches between Pools, Playoffs and Schedule", async () => {
  await showDivision(tournament);

  await userEvent.press(screen.getByRole("tab", { name: "Playoffs" }));
  expect(screen.getByRole("tab", { name: "Playoffs" })).toBeSelected();
  expect(screen.getByRole("tab", { name: "Pools" })).not.toBeSelected();
  expect(screen.getByText("Playoffs are coming soon")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("tab", { name: "Schedule" }));
  expect(screen.getByRole("tab", { name: "Schedule" })).toBeSelected();
  expect(screen.getByText("The schedule is coming soon")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("tab", { name: "Pools" }));
  expect(screen.getByText("Pools are coming soon")).toBeOnTheScreen();
});

it("counts a single team", async () => {
  await showDivision(tournament, "d2");

  expect(screen.getByRole("header", { name: "4v4 Women's B" })).toBeOnTheScreen();
  expect(screen.getByText("1 team registered")).toBeOnTheScreen();
});

it("says when the division isn't in the tournament", async () => {
  jest.mocked(getOrganizerPage).mockResolvedValue(tournament);
  await render(<GameSetupScreen id="t1" divisionId="gone" />);

  expect(
    await screen.findByText("This division isn't in the tournament anymore."),
  ).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Try again" })).not.toBeOnTheScreen();
});

it("goes back where it came from", async () => {
  await showDivision(tournament);

  await userEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.back).toHaveBeenCalled();
});

it.each([
  ["the list of divisions", tournament, "/tournaments/t1/game-setup"],
  ["the tournament's page when it has one division", oneDivision, "/tournaments/t1"],
])("goes back to %s when opened directly", async (_, page, expected) => {
  await showDivision(page);
  jest.mocked(router.canGoBack).mockReturnValue(false);

  await userEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.replace).toHaveBeenCalledWith(expected);
});
