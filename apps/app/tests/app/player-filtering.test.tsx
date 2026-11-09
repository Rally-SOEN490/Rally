// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import SearchScreen from "@/app/(tabs)/search";
import { ApiError, getPlayers } from "@/lib/api";
import type { RallyPlayer, RallyUser } from "@/lib/api";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return { useFocusEffect: (effect: () => void) => useEffect(effect, [effect]) };
});
jest.mock("@/lib/tournaments", () => ({
  ...jest.requireActual("@/lib/tournaments"),
  getTournaments: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/lib/search-fonts", () => ({ useSearchFonts: () => ({}) }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), getPlayers: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const user = { uid: "viewer", getIdToken: jest.fn() } as unknown as User;
const players: RallyPlayer[] = [
  {
    id: "a",
    displayName: "Alex Kim",
    skillLevel: "C",
    lookingForTeam: false,
    createdAt: "2026-11-02",
    badges: [],
    interests: { formats: ["indoor-6s"], positions: ["outside"], other: ["co-ed"] },
  },
  {
    id: "z",
    displayName: "Zoe Tran",
    skillLevel: "B",
    lookingForTeam: true,
    createdAt: "2026-11-02",
    badges: [],
    interests: { formats: ["beach-2s"], positions: ["setter"], other: ["co-ed"] },
  },
  {
    id: "s",
    displayName: "Sam Lee",
    skillLevel: "C+",
    lookingForTeam: false,
    createdAt: "2026-11-02",
    badges: [],
    interests: { formats: ["grass-4s"], positions: ["opposite"], other: ["co-ed"] },
  },
];
beforeEach(() => {
  jest.mocked(getPlayers).mockReset().mockResolvedValue(players);
  jest
    .mocked(useSession)
    .mockReturnValue(
      fakeSession({ user, account: { interests: players[1].interests } as RallyUser }),
    );
});
async function showPlayers() {
  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Alex Kim");
}
const open = () => userEvent.press(screen.getByRole("button", { name: "Open filters" }));
const apply = () => userEvent.press(screen.getByRole("button", { name: "Apply" }));

it("applies multiple filters with text search and removes individual chips", async () => {
  await showPlayers();
  await userEvent.type(screen.getByPlaceholderText("Search players by name"), "ZOE");
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "B" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "Setter" }));
  await apply();
  expect(screen.getByText("Zoe Tran")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Kim")).not.toBeOnTheScreen();
  expect(screen.getByLabelText("2 active filters")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Remove B filter" }));
  expect(screen.getByLabelText("1 active filter")).toBeOnTheScreen();
  expect(screen.getByDisplayValue("ZOE")).toBeOnTheScreen();
});

it("discards draft choices on close and reopens the applied selections", async () => {
  await showPlayers();
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "C" }));
  await apply();
  await open();
  expect(screen.getByRole("checkbox", { name: "C" })).toBeChecked();
  await userEvent.press(screen.getByRole("checkbox", { name: "B" }));
  await userEvent.press(screen.getAllByRole("button", { name: "Close player filters" }).at(-1)!);
  expect(screen.getByText("Alex Kim")).toBeOnTheScreen();
  expect(screen.queryByText("Zoe Tran")).not.toBeOnTheScreen();
  await open();
  expect(screen.getByRole("checkbox", { name: "B" })).not.toBeChecked();
  expect(screen.getByRole("checkbox", { name: "C" })).toBeChecked();
});

it("discards pending selections when the native modal requests dismissal", async () => {
  await showPlayers();
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "B" }));
  let modal = screen.getByRole("checkbox", { name: "B" });
  while (modal.parent && !modal.props.onRequestClose) modal = modal.parent;
  await fireEvent(modal, "requestClose");
  expect(screen.getByText("Alex Kim")).toBeOnTheScreen();
  await open();
  expect(screen.getByRole("checkbox", { name: "B" })).not.toBeChecked();
});

it("allows deselection, shows no matches, and recovers by removing the filter", async () => {
  await showPlayers();
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "Libero" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "Libero" }));
  expect(screen.getByRole("checkbox", { name: "Libero" })).not.toBeChecked();
  await userEvent.press(screen.getByRole("checkbox", { name: "Libero" }));
  await apply();
  expect(screen.getByText("No matching players")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Remove Libero filter" }));
  expect(screen.getByText("Alex Kim")).toBeOnTheScreen();
});

it("retains filters through tab changes and retries without applying them to tournaments", async () => {
  await showPlayers();
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "Opposite" }));
  await apply();
  await userEvent.type(screen.getByPlaceholderText("Search players by name"), "Sam");
  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));
  expect(screen.queryByRole("button", { name: "Remove Opposite filter" })).not.toBeOnTheScreen();
  jest.mocked(getPlayers).mockRejectedValueOnce(new ApiError(503, "Directory unavailable"));
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Directory unavailable");
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.getByDisplayValue("Sam")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Remove Opposite filter" })).toBeOnTheScreen();
});

it("uses shared interests for Recommended and lets the user choose Name A–Z", async () => {
  await showPlayers();
  const names = () =>
    screen.getAllByText(/^(Alex Kim|Zoe Tran|Sam Lee)$/).map((node) => node.props.children);
  expect(names()).toEqual(["Zoe Tran", "Alex Kim", "Sam Lee"]);
  await userEvent.press(screen.getByRole("button", { name: "Sort players: Recommended" }));
  await userEvent.press(screen.getByRole("radio", { name: "Name A–Z" }));
  expect(names()).toEqual(["Alex Kim", "Sam Lee", "Zoe Tran"]);
});

it("searches names and keeps missing preferences honest", async () => {
  jest.mocked(getPlayers).mockResolvedValue([
    ...players,
    {
      id: "u",
      displayName: "Unknown Player",
      lookingForTeam: false,
      createdAt: "2026-11-02",
      badges: [],
    },
  ]);
  await showPlayers();
  expect(screen.getByText("Preferences not available yet")).toBeOnTheScreen();
  await userEvent.type(screen.getByPlaceholderText("Search players by name"), "Sam");
  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Unknown Player")).not.toBeOnTheScreen();
});

it("clears active player filters from no matches while keeping the query and sort", async () => {
  await showPlayers();
  await userEvent.type(screen.getByPlaceholderText("Search players by name"), "Alex");
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "Libero" }));
  await apply();
  await userEvent.press(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByText("Alex Kim")).toBeOnTheScreen();
  expect(screen.getByDisplayValue("Alex")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Remove Libero filter" })).not.toBeOnTheScreen();
  await userEvent.clear(screen.getByPlaceholderText("Search players by name"));
  await userEvent.type(screen.getByPlaceholderText("Search players by name"), "Nobody");
  expect(screen.getByRole("button", { name: "Clear search" })).toBeOnTheScreen();
});

it("keeps each mode's applied filters through repeated mode switches", async () => {
  await showPlayers();
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "Setter" }));
  await apply();
  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));
  await open();
  await userEvent.press(screen.getByRole("checkbox", { name: "B+" }));
  await userEvent.press(screen.getByRole("button", { name: "Show 0 results" }));
  expect(screen.getByLabelText("1 active filter")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  expect(await screen.findByText("Zoe Tran")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Remove Setter filter" })).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));
  expect(screen.getByLabelText("1 active filter")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Remove Setter filter" })).not.toBeOnTheScreen();
  await open();
  expect(screen.getByRole("checkbox", { name: "B+" })).toBeChecked();
});
