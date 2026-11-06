// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import Events from "@/app/(tabs)/events";
import { ApiError, type RallyUser } from "@/lib/api";
import {
  deleteTournament,
  getMyTournaments,
  type Division,
  type OrganizerTournament,
} from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.setTimeout(20_000);

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    router: { push: jest.fn() },
    // Runs the effect once, as when the page first comes into view.
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
  };
});
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/organizer-tournaments", () => ({
  ...jest.requireActual("@/lib/organizer-tournaments"),
  deleteTournament: jest.fn(),
  getMyTournaments: jest.fn(),
}));

const user = { email: "org@example.com" } as User;
const showEventsAs = (role: RallyUser["role"]) => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account: { role } as RallyUser }));
  return render(<Events />);
};

const division: Division = {
  id: "d1",
  name: "6v6 Co-ed B",
  format: "6v6",
  type: "coed",
  levels: ["B"],
  maxTeams: 15,
  priceCents: 24000,
};
const draft = {
  id: "t1",
  status: "DRAFT",
  name: "Verdun Winter Cup",
  location: "Verdun Auditorium",
  startsAt: "2027-11-15T09:00",
  divisions: [division, { ...division, id: "d2", maxTeams: 8 }],
  registeredTeams: 0,
} as OrganizerTournament;
const published = {
  ...draft,
  id: "t2",
  status: "PUBLISHED",
  name: "Holiday Smash",
  startsAt: null,
  divisions: [],
} as OrganizerTournament;

beforeEach(() => {
  jest.mocked(getMyTournaments).mockResolvedValue([draft, published]);
});

it("shows players a coming-soon page, without the Organizer section", async () => {
  await showEventsAs("PLAYER");

  expect(screen.getByText("Coming soon")).toBeOnTheScreen();
  expect(
    screen.getByText("Tournaments and leagues you can join will show up here."),
  ).toBeOnTheScreen();
  expect(screen.queryByText("Create tournament")).not.toBeOnTheScreen();
  expect(getMyTournaments).not.toHaveBeenCalled();
});

it.each(["ORGANIZER", "ADMIN"] as const)("lists an %s's tournaments", async (role) => {
  await showEventsAs(role);

  expect(await screen.findByText("Verdun Winter Cup")).toBeOnTheScreen();
  expect(screen.getByText("2 tournaments")).toBeOnTheScreen();
  expect(screen.getByText("NOV")).toBeOnTheScreen();
  expect(screen.getByText("15")).toBeOnTheScreen();
  expect(screen.getByText("Verdun Auditorium · 6v6 Co-ed")).toBeOnTheScreen();
  expect(screen.getByText("0 / 23 teams")).toBeOnTheScreen();
  expect(screen.getByText("Draft")).toBeOnTheScreen();
  expect(screen.getByText("Published")).toBeOnTheScreen();
  expect(screen.getByText("TBD")).toBeOnTheScreen();
});

it("starts a new tournament from the Create button", async () => {
  await showEventsAs("ORGANIZER");

  await userEvent.press(screen.getByRole("button", { name: "Create tournament" }));

  expect(router.push).toHaveBeenCalledWith("/tournaments/new");
});

it("reopens a draft's setup, but has nothing to open for a published one yet", async () => {
  await showEventsAs("ORGANIZER");

  await userEvent.press(
    await screen.findByRole("button", { name: "Continue setting up Verdun Winter Cup" }),
  );

  expect(router.push).toHaveBeenCalledWith("/tournaments/t1/setup");
  expect(
    screen.queryByRole("button", { name: "Continue setting up Holiday Smash" }),
  ).not.toBeOnTheScreen();
});

it("says when there are no tournaments yet", async () => {
  jest.mocked(getMyTournaments).mockResolvedValue([]);
  await showEventsAs("ORGANIZER");

  expect(await screen.findByText("You haven't created a tournament yet.")).toBeOnTheScreen();
});

it("offers to try again when the list can't be loaded", async () => {
  jest
    .mocked(getMyTournaments)
    .mockRejectedValueOnce(new ApiError(0, "Can't reach the Rally server."));
  await showEventsAs("ORGANIZER");
  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByText("Verdun Winter Cup")).toBeOnTheScreen();
});

// ---------- Deleting a draft ----------

const askToDelete = async () => {
  await showEventsAs("ORGANIZER");
  await userEvent.press(await screen.findByRole("button", { name: "Delete Verdun Winter Cup" }));
};

it("deletes a draft once the organizer confirms", async () => {
  jest.mocked(deleteTournament).mockResolvedValue();
  await askToDelete();
  expect(screen.getByText("Delete Verdun Winter Cup?")).toBeOnTheScreen();
  expect(deleteTournament).not.toHaveBeenCalled();

  await userEvent.press(screen.getByRole("button", { name: "Delete" }));

  expect(deleteTournament).toHaveBeenCalledWith(user, "t1");
  expect(screen.queryByText("Verdun Winter Cup")).not.toBeOnTheScreen();
  expect(screen.getByText("1 tournament")).toBeOnTheScreen();
});

it("keeps the draft when the organizer cancels", async () => {
  await askToDelete();

  await userEvent.press(screen.getByRole("button", { name: "Cancel" }));

  expect(deleteTournament).not.toHaveBeenCalled();
  expect(screen.getByText("Verdun Winter Cup")).toBeOnTheScreen();
});

it("keeps the draft listed when deleting fails", async () => {
  jest.mocked(deleteTournament).mockRejectedValue(new ApiError(0, "Can't reach the Rally server."));
  await askToDelete();

  await userEvent.press(screen.getByRole("button", { name: "Delete" }));

  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();
  expect(screen.getByText("Verdun Winter Cup")).toBeOnTheScreen();
});

it("offers no delete button for a published tournament", async () => {
  await showEventsAs("ORGANIZER");
  await screen.findByText("Holiday Smash");

  expect(screen.queryByRole("button", { name: "Delete Holiday Smash" })).not.toBeOnTheScreen();
});
