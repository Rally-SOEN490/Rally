// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, render, screen, userEvent, within } from "@testing-library/react-native";
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

const user = {} as User;

const division = (overrides: Partial<BrowseDivision>): BrowseDivision => ({
  id: "d1",
  name: "6v6 Co-ed B",
  format: "6v6",
  type: "coed",
  levels: ["B"],
  maxTeams: 15,
  priceCents: 24000,
  registeredTeams: 10,
  ...overrides,
});

// Sign-ups are open; Co-ed B has 5 spots left, Co-ed A is full, Women Open has 8.
const page: TournamentPage = {
  id: "t1",
  name: "Verdun Winter Cup",
  location: "Verdun Auditorium",
  description: null,
  startsAt: "2027-11-15T09:00",
  endsAt: "2027-11-15T19:00",
  registrationOpensAt: "2027-10-20T12:00",
  registrationClosesAt: "2027-11-09T23:59",
  organizerName: "Maya Tremblay",
  divisions: [
    division({}),
    division({ id: "d2", name: "6v6 Co-ed A", maxTeams: 8, registeredTeams: 8 }),
    division({ id: "d3", name: "6v6 Women Open", priceCents: 26000, registeredTeams: 7 }),
  ],
  isOrganizer: false,
  signUps: "OPEN",
  myTeam: null,
};

// Only what's in the sheet, not the page behind it.
const inSheet = () => within(screen.getByTestId("sign-up sheet"));

const team = {
  id: "team1",
  name: "Spike Lee",
  divisionId: "d1",
  divisionName: "6v6 Co-ed B",
  isCaptain: true,
};

const openSheet = async (shown: TournamentPage = page) => {
  jest.mocked(getTournamentPage).mockResolvedValue(shown);
  await render(<TournamentPageScreen id={shown.id} />);
  await userEvent.press(await screen.findByRole("button", { name: "Sign up" }));
};

// Picks Co-ed B, types the name and continues to the review step.
const fillIn = async (name = "Spike Lee") => {
  await userEvent.press(screen.getByRole("radio", { name: "6v6 Co-ed B" }));
  await userEvent.type(screen.getByLabelText("Team name"), name);
  await userEvent.press(screen.getByRole("button", { name: "Continue" }));
};

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(getTournamentPage).mockReset();
  jest.mocked(signUpTeam).mockReset();
});

it("lists the divisions with their spots, and a full one can't be picked", async () => {
  await openSheet();

  expect(screen.getByRole("header", { name: "Create a team" })).toBeOnTheScreen();
  expect(screen.getByText("5 left")).toBeOnTheScreen();
  expect(screen.getByText("8 left")).toBeOnTheScreen();
  expect(screen.getByRole("radio", { name: "6v6 Co-ed A" })).toBeDisabled();
  expect(
    screen.getByText("You'll be the captain. You can be on only one team in this tournament."),
  ).toBeOnTheScreen();
});

it("needs a division and a name before continuing", async () => {
  await openSheet();
  const next = screen.getByRole("button", { name: "Continue" });
  expect(next).toBeDisabled();

  await userEvent.press(screen.getByRole("radio", { name: "6v6 Co-ed B" }));
  expect(next).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Team name"), "   ");
  expect(next).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Team name"), "Spike");
  expect(next).toBeEnabled();
});

it("picks the only division with room for you", async () => {
  await openSheet({ ...page, divisions: [page.divisions[0], page.divisions[1]] });

  expect(screen.getByRole("radio", { name: "6v6 Co-ed B" })).toBeChecked();
});

it("shows the team, division and price to check before signing up", async () => {
  await openSheet();
  await fillIn("  Spike   Lee ");

  expect(screen.getByRole("header", { name: "Check your team" })).toBeOnTheScreen();
  expect(inSheet().getByText("Spike Lee")).toBeOnTheScreen();
  expect(inSheet().getByText("6v6 Co-ed B")).toBeOnTheScreen();
  expect(inSheet().getByText("$240 / team")).toBeOnTheScreen();
  expect(screen.getByText("Pay $240 to the organizer outside Rally.")).toBeOnTheScreen();
});

it("doesn't mention paying for a free division", async () => {
  await openSheet({ ...page, divisions: [division({ priceCents: 0 })] });
  await fillIn();

  expect(screen.getByText("Free")).toBeOnTheScreen();
  expect(screen.queryByText(/outside Rally/)).not.toBeOnTheScreen();
});

// The page as the server sends it after the sign-up: our team, and another
// one that signed up in Co-ed B while the page was open.
const afterSignUp = <Page extends TournamentPage>(before: Page): Page => ({
  ...before,
  myTeam: team,
  divisions: before.divisions.map((d) =>
    d.id === "d1" ? { ...d, registeredTeams: d.registeredTeams + 2 } : d,
  ),
});

it("signs the team up, shows it once the server confirms and fetches the counts again", async () => {
  jest.mocked(signUpTeam).mockResolvedValue(team);
  await openSheet();
  jest.mocked(getTournamentPage).mockResolvedValue(afterSignUp(page));
  await fillIn("  Spike   Lee ");

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));

  expect(signUpTeam).toHaveBeenCalledWith(user, "t1", { divisionId: "d1", name: "Spike Lee" });
  expect(await screen.findByText("You're captain of Spike Lee")).toBeOnTheScreen();
  expect(screen.queryByRole("header", { name: "Check your team" })).not.toBeOnTheScreen();
  expect(await screen.findByText("$240 · 3 spots left")).toBeOnTheScreen();
  expect(getTournamentPage).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("button", { name: "Sign up" })).not.toBeOnTheScreen();
});

it("still shows the team if fetching the page again fails", async () => {
  jest.mocked(signUpTeam).mockResolvedValue(team);
  await openSheet();
  jest.mocked(getTournamentPage).mockRejectedValue(new ApiError(503, "Rally is unavailable."));
  await fillIn();

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));

  expect(await screen.findByText("You're captain of Spike Lee")).toBeOnTheScreen();
  expect(getTournamentPage).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Rally is unavailable.")).not.toBeOnTheScreen();
  expect(screen.getByText("$240 · 5 spots left")).toBeOnTheScreen();
});

it("fetches the divisions again when the picked one fills up meanwhile", async () => {
  jest.mocked(signUpTeam).mockRejectedValue(new ApiError(409, "This division is full."));
  await openSheet();
  jest.mocked(getTournamentPage).mockResolvedValue({
    ...page,
    divisions: page.divisions.map((d) => (d.id === "d1" ? { ...d, registeredTeams: 15 } : d)),
  });
  await fillIn();

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));

  expect(await screen.findByText("This division is full.")).toBeOnTheScreen();
  expect(getTournamentPage).toHaveBeenCalledTimes(2);
  expect(await screen.findByRole("button", { name: "Create team and sign up" })).toBeDisabled();
  await userEvent.press(screen.getByRole("button", { name: "Back to the team details" }));
  expect(screen.getByRole("radio", { name: "6v6 Co-ed B" })).toBeDisabled();
  expect(screen.getByLabelText("Team name")).toHaveDisplayValue("Spike Lee");
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
});

it("ignores an older refresh that answers after the team is signed up", async () => {
  jest
    .mocked(signUpTeam)
    .mockRejectedValueOnce(new ApiError(409, "This division is full."))
    .mockResolvedValueOnce(team);
  await openSheet();
  let answerFirstRefresh = (_: TournamentPage) => {};
  jest
    .mocked(getTournamentPage)
    .mockReturnValueOnce(new Promise((resolve) => (answerFirstRefresh = resolve)))
    .mockResolvedValueOnce(afterSignUp(page));
  await fillIn();

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));
  await userEvent.press(await screen.findByRole("button", { name: "Create team and sign up" }));
  expect(await screen.findByText("$240 · 3 spots left")).toBeOnTheScreen();
  await act(async () => answerFirstRefresh(page));

  expect(screen.getByText("You're captain of Spike Lee")).toBeOnTheScreen();
  expect(screen.getByText("$240 · 3 spots left")).toBeOnTheScreen();
});

it("doesn't fetch the page again when the server can't be reached", async () => {
  jest.mocked(signUpTeam).mockRejectedValue(new Error("Network request failed"));
  await openSheet();
  await fillIn();

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));

  expect(await screen.findByRole("alert")).toBeOnTheScreen();
  expect(getTournamentPage).toHaveBeenCalledTimes(1);
});

it("says it is signing up and can't be sent twice meanwhile", async () => {
  jest.mocked(signUpTeam).mockReturnValue(new Promise(() => {}));
  await openSheet();
  await fillIn();

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));

  expect(screen.getByRole("button", { name: "Signing up…" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Back to the team details" })).not.toBeOnTheScreen();
});

it("keeps what was typed when the server refuses, and lets you go back to fix it", async () => {
  jest
    .mocked(signUpTeam)
    .mockRejectedValueOnce(
      new ApiError(409, "Another team in this tournament already has that name. Pick another one."),
    )
    .mockResolvedValueOnce({ ...team, name: "Spike Lee 2" });
  await openSheet();
  await fillIn();

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));
  expect(
    await screen.findByText(
      "Another team in this tournament already has that name. Pick another one.",
    ),
  ).toBeOnTheScreen();
  expect(screen.queryByText(/You're captain/)).not.toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Back to the team details" }));
  expect(screen.getByLabelText("Team name")).toHaveDisplayValue("Spike Lee");
  expect(screen.getByRole("radio", { name: "6v6 Co-ed B" })).toBeChecked();
  await userEvent.type(screen.getByLabelText("Team name"), " 2");
  await userEvent.press(screen.getByRole("button", { name: "Continue" }));
  jest
    .mocked(getTournamentPage)
    .mockResolvedValue({ ...afterSignUp(page), myTeam: { ...team, name: "Spike Lee 2" } });
  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));

  expect(signUpTeam).toHaveBeenLastCalledWith(user, "t1", {
    divisionId: "d1",
    name: "Spike Lee 2",
  });
  expect(await screen.findByText("You're captain of Spike Lee 2")).toBeOnTheScreen();
});

it("closes without signing up", async () => {
  await openSheet();

  await userEvent.press(screen.getByRole("button", { name: "Close" }));

  expect(screen.queryByRole("header", { name: "Create a team" })).not.toBeOnTheScreen();
  expect(signUpTeam).not.toHaveBeenCalled();
});

it("updates the organizer's team total from the server too", async () => {
  jest.mocked(signUpTeam).mockResolvedValue(team);
  const forOrganizer: Extract<TournamentPage, { isOrganizer: true }> = {
    ...page,
    isOrganizer: true,
    status: "PUBLISHED",
    courts: 3,
    publishedAt: "2027-10-01T12:00:00.000Z",
    registeredTeams: 25,
  };
  await openSheet(forOrganizer);
  jest
    .mocked(getTournamentPage)
    .mockResolvedValue({ ...afterSignUp(forOrganizer), registeredTeams: 27 });
  await fillIn();

  await userEvent.press(screen.getByRole("button", { name: "Create team and sign up" }));

  expect(await screen.findByText("27 / 38 teams")).toBeOnTheScreen();
  expect(screen.getByText("$240 · 12 / 15 teams")).toBeOnTheScreen();
});
