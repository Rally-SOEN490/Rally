// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import SearchScreen from "@/app/(tabs)/search";
import { SearchBar } from "@/components/searchBar";
import { ApiError, getPlayers } from "@/lib/api";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("@/lib/search-fonts", () => ({
  useSearchFonts: () => ({
    regular: "InterRegular",
    medium: "InterMedium",
    semibold: "InterSemiBold",
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

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

it("uses the tournament placeholder by default and forwards input changes", async () => {
  const onChangeText = jest.fn();

  await render(<SearchBar value="" onChangeText={onChangeText} />);

  const input = screen.getByPlaceholderText("Search for events, venue, organizer");
  await userEvent.type(input, "Cup");

  expect(onChangeText).toHaveBeenCalledWith("C");
});

it("uses the player placeholder and invokes the optional filter action", async () => {
  const onPressFilter = jest.fn();

  await render(
    <SearchBar value="" onChangeText={jest.fn()} mode="players" onPressFilter={onPressFilter} />,
  );

  expect(screen.getByPlaceholderText("Search name, level")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Open filters" }));

  expect(onPressFilter).toHaveBeenCalledTimes(1);
});

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
  const searchInput = screen.getByPlaceholderText("Search name, level");
  await userEvent.type(searchInput, "sam");

  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Kim")).not.toBeOnTheScreen();
});

it("shows an empty result message when no players match", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Alex Kim");
  await userEvent.type(screen.getByPlaceholderText("Search name, level"), "Taylor");

  expect(screen.getByText("No matching players")).toBeOnTheScreen();
});

it("shows the API error when loading players fails", async () => {
  jest.mocked(getPlayers).mockRejectedValue(new ApiError(503, "Directory unavailable"));

  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));

  expect(await screen.findByText("Directory unavailable")).toBeOnTheScreen();
});

it("shows and searches mock tournament names", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  await waitFor(() => expect(screen.queryByText("Loading players…")).not.toBeOnTheScreen());
  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));

  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();
  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();

  await userEvent.type(
    screen.getByPlaceholderText("Search for events, venue, organizer"),
    "concordia",
  );

  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.queryByText("Montreal Spring Open")).not.toBeOnTheScreen();
});

it("remembers the selected tab after leaving and reopening Search", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  const firstVisit = await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  expect(await screen.findByText("Alex Kim")).toBeOnTheScreen();
  await waitFor(() => expect(screen.queryByText("Loading players…")).not.toBeOnTheScreen());
  await firstVisit.unmount();

  jest.mocked(getPlayers).mockClear();
  const secondVisit = await render(<SearchScreen />);
  await waitFor(() => expect(getPlayers).toHaveBeenCalledWith(user));
  expect(await screen.findByText("Alex Kim")).toBeOnTheScreen();
  await waitFor(() => expect(screen.queryByText("Loading players…")).not.toBeOnTheScreen());

  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));
  await secondVisit.unmount();
});

it("preserves the name query when retrying a failed directory request", async () => {
  jest
    .mocked(getPlayers)
    .mockRejectedValueOnce(new ApiError(503, "Directory unavailable"))
    .mockResolvedValueOnce(players);
  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Directory unavailable");
  await userEvent.type(screen.getByPlaceholderText("Search name, level"), "SAM");
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Kim")).not.toBeOnTheScreen();
  expect(screen.getByPlaceholderText("Search name, level")).toHaveDisplayValue("SAM");
  expect(getPlayers).toHaveBeenCalledTimes(2);
});

it("clears an unmatched name without reloading the directory", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);
  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Alex Kim");
  await userEvent.type(screen.getByPlaceholderText("Search name, level"), "Nobody");
  await userEvent.press(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByText("Alex Kim")).toBeOnTheScreen();
  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(getPlayers).toHaveBeenCalledTimes(1);
});

it("shows the empty directory separately from an unmatched search", async () => {
  jest.mocked(getPlayers).mockResolvedValue([]);
  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  expect(await screen.findByText("No players yet")).toBeOnTheScreen();
  expect(screen.queryByText("No matching players")).not.toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Open filters" })).toBeEnabled();
});

it("shows loading until the player directory request finishes", async () => {
  let finish!: (value: typeof players) => void;
  jest.mocked(getPlayers).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  expect(screen.getByText("Loading players…")).toBeOnTheScreen();
  expect(screen.queryByText("No players yet")).not.toBeOnTheScreen();
  await act(async () => {
    finish(players);
  });
  expect(await screen.findByText("Alex Kim")).toBeOnTheScreen();
  expect(screen.queryByText("Loading players…")).not.toBeOnTheScreen();
});
