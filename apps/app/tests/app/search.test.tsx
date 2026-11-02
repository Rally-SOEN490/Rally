// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import type { User } from "firebase/auth";
import SearchScreen from "@/app/(tabs)/search";
import { SearchBar } from "@/components/searchBar";
import { ApiError, getPlayers } from "@/lib/api";
import { getTournaments, type Tournament } from "@/lib/tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("@/lib/search-fonts", () => ({
  useSearchFonts: () => ({
    regular: "InterRegular",
    medium: "InterMedium",
    semibold: "InterSemiBold",
  }),
}));

jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  getPlayers: jest.fn(),
}));
jest.mock("@/lib/tournaments", () => ({
  ...jest.requireActual("@/lib/tournaments"),
  getTournaments: jest.fn(),
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
const tournaments: Tournament[] = [
  {
    id: "spring-open",
    name: "Montreal Spring Open",
    date: "2026-11-07",
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    venue: "Parc Jean-Drapeau",
    organizer: "Montreal Volleyball Club",
    format: "Beach 4s",
    level: "Intermediate",
    surface: "Beach",
    teamSize: 4,
    pricePerTeam: 80,
    spotsLeft: 8,
    spotsTotal: 16,
  },
  {
    id: "fall-classic",
    name: "Concordia Fall Classic",
    date: "2026-11-20",
    startTime: "8:30 AM",
    endTime: "6:00 PM",
    venue: "Concordia University Gym",
    organizer: "Concordia Recreation",
    format: "Indoor 6s",
    level: "Competitive",
    surface: "Indoor",
    teamSize: 6,
    pricePerTeam: 140,
    spotsLeft: 0,
    spotsTotal: 12,
  },
  {
    id: "open-gym",
    name: "Open Gym Tournament",
    organizer: "Rally Community",
    format: "Indoor 6s",
    level: "Recreational",
    surface: "Indoor",
    teamSize: 6,
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

  expect(screen.getByPlaceholderText("Search name")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Open filters" }));

  expect(onPressFilter).toHaveBeenCalledTimes(1);
});

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(getPlayers).mockReset();
  jest.mocked(getTournaments).mockReset().mockResolvedValue(tournaments);
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
  const searchInput = screen.getByPlaceholderText("Search name");
  await userEvent.type(searchInput, "sam");

  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Kim")).not.toBeOnTheScreen();
});

it("shows an empty result message when no players match", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Alex Kim");
  await userEvent.type(screen.getByPlaceholderText("Search name"), "Taylor");

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
  expect(screen.getByText("9:00 AM – 5:00 PM")).toBeOnTheScreen();
  expect(screen.getByText("Parc Jean-Drapeau")).toBeOnTheScreen();
  expect(screen.getByText("Beach 4s")).toBeOnTheScreen();
  expect(screen.getByText("$80 per team")).toBeOnTheScreen();
  expect(screen.getByText("8 of 16 spots left")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Full" })).toBeDisabled();

  await userEvent.type(
    screen.getByPlaceholderText("Search for events, venue, organizer"),
    "concordia",
  );

  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.queryByText("Montreal Spring Open")).not.toBeOnTheScreen();
});

it("shows registration unavailability after clicking Register on web", async () => {
  const originalOS = Platform.OS;
  const platformOS = jest.replaceProperty(Platform, "OS", "web");
  jest.mocked(getTournaments).mockResolvedValueOnce([tournaments[0]]);

  try {
    await render(<SearchScreen />);
    await screen.findByText("Montreal Spring Open");
    await userEvent.press(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Registration isn't available yet.")).toBeOnTheScreen();
  } finally {
    platformOS.restore();
    expect(Platform.OS).toBe(originalOS);
  }
});

it("searches tournament names, venues, and organizers without case sensitivity", async () => {
  await render(<SearchScreen />);
  await screen.findByText("Montreal Spring Open");
  const search = screen.getByPlaceholderText("Search for events, venue, organizer");

  await userEvent.type(search, "CONCORDIA UNIVERSITY");
  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.queryByText("Montreal Spring Open")).not.toBeOnTheScreen();

  await userEvent.clear(search);
  await userEvent.type(search, "rAlLy CoMmUnItY");
  expect(screen.getByText("Open Gym Tournament")).toBeOnTheScreen();
  expect(screen.queryByText("Concordia Fall Classic")).not.toBeOnTheScreen();
});

it("combines text search and filters, applies them, and supports chips and Clear all", async () => {
  await render(<SearchScreen />);
  await screen.findByText("Montreal Spring Open");
  const search = screen.getByPlaceholderText("Search for events, venue, organizer");
  await userEvent.type(search, "montreal");
  await userEvent.press(screen.getByRole("button", { name: "Open filters" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "Intermediate" }));
  expect(screen.getByRole("button", { name: "Show 1 result" })).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Show 1 result" }));

  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();
  expect(screen.getByText("1 result")).toBeOnTheScreen();
  expect(screen.getByText("Intermediate ×")).toBeOnTheScreen();
  expect(screen.getByLabelText("1 active filter")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Remove Intermediate filter" }));
  expect(screen.queryByText("Intermediate ×")).not.toBeOnTheScreen();
  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Open filters" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "Indoor 6s" }));
  await userEvent.press(screen.getByRole("button", { name: "Show 0 results" }));
  expect(screen.getByText("No matching tournaments")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Clear all" }));
  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();
});

it("shows loading, empty, and retryable failure states without losing query or filters", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);
  let resolveTournaments!: (result: Tournament[]) => void;
  jest.mocked(getTournaments).mockReturnValue(
    new Promise((resolve) => {
      resolveTournaments = resolve;
    }),
  );
  await render(<SearchScreen />);
  expect(screen.getByText("Loading tournaments…")).toBeOnTheScreen();
  await act(async () => resolveTournaments(tournaments));
  expect(await screen.findByText("Montreal Spring Open")).toBeOnTheScreen();

  jest.mocked(getTournaments).mockResolvedValueOnce([]);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));
  expect(await screen.findByText("No tournaments are available yet.")).toBeOnTheScreen();

  jest
    .mocked(getTournaments)
    .mockRejectedValueOnce(new ApiError(503, "Tournament directory unavailable"))
    .mockResolvedValueOnce(tournaments);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));
  expect(await screen.findByText("Tournament directory unavailable")).toBeOnTheScreen();
  const search = screen.getByPlaceholderText("Search for events, venue, organizer");
  await userEvent.type(search, "concordia");
  await userEvent.press(screen.getByRole("button", { name: "Open filters" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "Competitive" }));
  await userEvent.press(screen.getByRole("button", { name: "Show 0 results" }));
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.getByDisplayValue("concordia")).toBeOnTheScreen();
  expect(screen.getByText("Competitive ×")).toBeOnTheScreen();
});

it("keeps cards readable when tournament details are missing", async () => {
  await render(<SearchScreen />);
  await screen.findByText("Montreal Spring Open");
  await userEvent.type(
    screen.getByPlaceholderText("Search for events, venue, organizer"),
    "open gym",
  );

  expect(screen.getByText("Open Gym Tournament")).toBeOnTheScreen();
  expect(screen.getByText("Date TBA")).toBeOnTheScreen();
  expect(screen.getByText("Price TBA")).toBeOnTheScreen();
  expect(screen.getByText("Spots not available")).toBeOnTheScreen();
  expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
});

it("renders complete long tournament names and venues", async () => {
  const name = "Montreal Community Volleyball Tournament for All Levels";
  const venue = "Centre Sportif Universitaire de l'Université de Montréal";
  jest.mocked(getTournaments).mockResolvedValue([{ ...tournaments[0], name, venue }]);
  await render(<SearchScreen />);

  expect(await screen.findByText(name)).toBeOnTheScreen();
  expect(screen.getByText(venue)).toBeOnTheScreen();
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
  await userEvent.type(screen.getByPlaceholderText("Search name"), "SAM");
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Kim")).not.toBeOnTheScreen();
  expect(screen.getByPlaceholderText("Search name")).toHaveDisplayValue("SAM");
  expect(getPlayers).toHaveBeenCalledTimes(2);
});

it("clears an unmatched name without reloading the directory", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);
  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  await screen.findByText("Alex Kim");
  await userEvent.type(screen.getByPlaceholderText("Search name"), "Nobody");
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
  expect(screen.getByRole("button", { name: "Filters are coming soon" })).toBeDisabled();
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
