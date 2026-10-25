/*
AI declaration:
50% or more AI-generated
*/

// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import SearchScreen from "@/app/search";
import { getPlayers } from "@/lib/api";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  getPlayers: jest.fn(),
}));

const user = { getIdToken: jest.fn() } as unknown as User;
const players = [
  {
    id: "1",
    displayName: "Alex Kim",
    lookingForTeam: true,
    createdAt: "2026-10-17T12:00:00.000Z",
    badges: [],
  },
  {
    id: "2",
    displayName: "Sam Lee",
    lookingForTeam: false,
    createdAt: "2026-10-18T12:00:00.000Z",
    badges: [],
  },
];

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(getPlayers).mockReset();
});

it("fetches and displays players when the Players tab is selected", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  expect(getPlayers).not.toHaveBeenCalled();

  await userEvent.press(screen.getByRole("tab", { name: "Players" }));

  await waitFor(() => expect(getPlayers).toHaveBeenCalledWith(user));
  expect(await screen.findByText("Alex Kim")).toBeOnTheScreen();
  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
});

it("filters player names using the search bar", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Alex Kim");
  const searchInput = screen.getByPlaceholderText("Search for name, level");
  await userEvent.type(searchInput, "sam");

  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Kim")).not.toBeOnTheScreen();
});

it("shows an empty result message when no players match", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Alex Kim");
  await userEvent.type(screen.getByPlaceholderText("Search for name, level"), "Taylor");

  expect(screen.getByText("No matching players.")).toBeOnTheScreen();
});

it("shows and searches mock tournament names", async () => {
  await render(<SearchScreen />);

  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();
  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();

  await userEvent.type(
    screen.getByPlaceholderText("Search for events, venue, organizer"),
    "concordia",
  );

  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.queryByText("Montreal Spring Open")).not.toBeOnTheScreen();
});