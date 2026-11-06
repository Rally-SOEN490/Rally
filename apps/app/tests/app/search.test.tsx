// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import SearchScreen from "@/app/(tabs)/search";
import { SearchBar } from "@/components/searchBar";
import { ApiError, getPlayers } from "@/lib/api";
import { getTournaments, type BrowseDivision, type Tournament } from "@/lib/tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("@/lib/search-fonts", () => ({
  useSearchFonts: () => ({
    regular: "InterRegular",
    medium: "InterMedium",
    semibold: "InterSemiBold",
  }),
}));

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    router: { push: jest.fn() },
    // Runs the effect once, as when Search first comes into view.
    // search-navigation.test.tsx checks coming back with the real navigator.
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
  };
});
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
const division = (overrides: Partial<BrowseDivision>): BrowseDivision => ({
  id: "division",
  name: "Division",
  format: "6v6",
  type: "coed",
  levels: ["B"],
  maxTeams: 16,
  priceCents: 8000,
  registeredTeams: 0,
  ...overrides,
});
const tournaments: Tournament[] = [
  {
    id: "spring-open",
    name: "Montreal Spring Open",
    location: "Parc Jean-Drapeau",
    startsAt: "2026-11-07T09:00",
    endsAt: "2026-11-07T17:00",
    registrationOpensAt: "2026-10-01T09:00",
    registrationClosesAt: "2026-11-05T23:59",
    organizerName: "Montreal Volleyball Club",
    divisions: [division({ format: "4v4", levels: ["B", "B+"], registeredTeams: 8 })],
  },
  {
    id: "fall-classic",
    name: "Concordia Fall Classic",
    location: "Concordia University Gym",
    startsAt: "2026-11-20T08:30",
    endsAt: "2026-11-20T18:00",
    registrationOpensAt: "2026-10-15T09:00",
    registrationClosesAt: "2026-11-18T23:59",
    organizerName: "Concordia Recreation",
    divisions: [
      division({
        type: "men",
        levels: ["A"],
        priceCents: 14000,
        maxTeams: 12,
        registeredTeams: 12,
      }),
    ],
  },
  // Not something the API sends, but the card must still read well without details.
  {
    id: "open-gym",
    name: "Open Gym Tournament",
    location: null,
    startsAt: null,
    endsAt: null,
    registrationOpensAt: null,
    registrationClosesAt: null,
    organizerName: "Rally Community",
    divisions: [],
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

it("shows and searches published tournaments", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  await waitFor(() => expect(screen.queryByText("Loading players…")).not.toBeOnTheScreen());
  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));

  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();
  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.getByText("9:00 AM – 5:00 PM")).toBeOnTheScreen();
  expect(screen.getByText("Parc Jean-Drapeau")).toBeOnTheScreen();
  expect(screen.getByText("4v4 Co-ed")).toBeOnTheScreen();
  expect(screen.getByText("B / B+")).toBeOnTheScreen();
  expect(screen.getByText("$80 per team")).toBeOnTheScreen();
  expect(screen.getByText("8 of 16 spots left")).toBeOnTheScreen();
  expect(screen.getByText("Full")).toBeOnTheScreen();
  expect(getTournaments).toHaveBeenCalledWith(user);

  await userEvent.type(
    screen.getByPlaceholderText("Search for events, venue, organizer"),
    "concordia",
  );

  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.queryByText("Montreal Spring Open")).not.toBeOnTheScreen();
});

it("opens a tournament's page from its card, even when it's full", async () => {
  await render(<SearchScreen />);
  await screen.findByText("Montreal Spring Open");

  await userEvent.press(screen.getByRole("button", { name: "Open Montreal Spring Open" }));
  expect(router.push).toHaveBeenLastCalledWith("/tournaments/spring-open");

  await userEvent.press(screen.getByRole("button", { name: "Open Concordia Fall Classic" }));
  expect(router.push).toHaveBeenLastCalledWith("/tournaments/fall-classic");
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
  await userEvent.press(screen.getByRole("checkbox", { name: "B+" }));
  expect(screen.getByRole("button", { name: "Show 1 result" })).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Show 1 result" }));

  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();
  expect(screen.getByText("1 result")).toBeOnTheScreen();
  expect(screen.getByText("B+ ×")).toBeOnTheScreen();
  expect(screen.getByLabelText("1 active filter")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Remove B+ filter" }));
  expect(screen.queryByText("B+ ×")).not.toBeOnTheScreen();
  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Open filters" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "6v6" }));
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
  await userEvent.press(screen.getByRole("checkbox", { name: "Men" }));
  await userEvent.press(screen.getByRole("button", { name: "Show 0 results" }));
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.getByDisplayValue("concordia")).toBeOnTheScreen();
  expect(screen.getByText("Men ×")).toBeOnTheScreen();
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

it("renders complete long tournament names and locations", async () => {
  const name = "Montreal Community Volleyball Tournament for All Levels";
  const location = "Centre Sportif Universitaire de l'Université de Montréal";
  jest.mocked(getTournaments).mockResolvedValue([{ ...tournaments[0], name, location }]);
  await render(<SearchScreen />);

  expect(await screen.findByText(name)).toBeOnTheScreen();
  expect(screen.getByText(location)).toBeOnTheScreen();
});

it("combines several divisions into one card", async () => {
  jest.mocked(getTournaments).mockResolvedValue([
    {
      ...tournaments[0],
      name: "Verdun Mixed Cup",
      endsAt: "2026-11-08T19:00",
      divisions: [
        division({ format: "6v6", levels: ["B+"], priceCents: 24000, maxTeams: 10 }),
        division({
          format: "2v2",
          type: "women",
          levels: ["C"],
          priceCents: 4050,
          maxTeams: 8,
          registeredTeams: 8,
        }),
      ],
    },
  ]);
  await render(<SearchScreen />);

  expect(await screen.findByText("Verdun Mixed Cup")).toBeOnTheScreen();
  expect(screen.getByText("2v2 Women")).toBeOnTheScreen();
  expect(screen.getByText("6v6 Co-ed")).toBeOnTheScreen();
  expect(screen.getByText("C / B+")).toBeOnTheScreen();
  expect(screen.getByText("From $40.50 per team")).toBeOnTheScreen();
  expect(screen.getByText("10 of 18 spots left")).toBeOnTheScreen();
  expect(screen.getByText("9:00 AM – Nov 8, 7:00 PM")).toBeOnTheScreen();
  expect(screen.getByText("Register")).toBeOnTheScreen();
});

it("filters by division type and removes the type and format chips", async () => {
  await render(<SearchScreen />);
  await screen.findByText("Montreal Spring Open");
  await userEvent.press(screen.getByRole("button", { name: "Open filters" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "Men" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "6v6" }));
  await userEvent.press(screen.getByRole("button", { name: "Show 1 result" }));

  expect(screen.getByText("Concordia Fall Classic")).toBeOnTheScreen();
  expect(screen.queryByText("Montreal Spring Open")).not.toBeOnTheScreen();
  expect(screen.getByLabelText("2 active filters")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Remove Men filter" }));
  await userEvent.press(screen.getByRole("button", { name: "Remove 6v6 filter" }));
  expect(screen.getByText("Montreal Spring Open")).toBeOnTheScreen();
  expect(screen.queryByText("Men ×")).not.toBeOnTheScreen();
});

it("shows a free tournament as free", async () => {
  jest
    .mocked(getTournaments)
    .mockResolvedValue([{ ...tournaments[0], divisions: [division({ priceCents: 0 })] }]);
  await render(<SearchScreen />);

  expect(await screen.findByText("Free")).toBeOnTheScreen();
});

it("doesn't load tournaments while signed out", async () => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: null }));
  await render(<SearchScreen />);

  expect(getTournaments).not.toHaveBeenCalled();
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
