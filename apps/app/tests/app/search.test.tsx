/*
AI declaration:
50% or more AI-generated
*/

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import SearchScreen from "@/app/search";
import { SearchBar } from "@/components/searchBar";
import { ApiError, getPlayers } from "@/lib/api";
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
    <SearchBar
      value=""
      onChangeText={jest.fn()}
      mode="players"
      onPressFilter={onPressFilter}
    />,
  );

  expect(screen.getByPlaceholderText("Search for name, level")).toBeOnTheScreen();
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

it("shows the API error when loading players fails", async () => {
  jest.mocked(getPlayers).mockRejectedValue(new ApiError(503, "Directory unavailable"));

  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));

  expect(await screen.findByText("Directory unavailable")).toBeOnTheScreen();
});

it("shows and searches mock tournament names", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  await render(<SearchScreen />);
  await waitFor(() => expect(screen.queryByText("Loading players...")).not.toBeOnTheScreen());
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

it("navigates to the profile from the You tab", async () => {
  await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("button", { name: "You" }));

  expect(router.replace).toHaveBeenCalledWith("/profile");
});

it("remembers the selected tab after leaving and reopening Search", async () => {
  jest.mocked(getPlayers).mockResolvedValue(players);

  const firstVisit = await render(<SearchScreen />);
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  expect(await screen.findByText("Alex Kim")).toBeOnTheScreen();
  await waitFor(() => expect(screen.queryByText("Loading players...")).not.toBeOnTheScreen());
  firstVisit.unmount();

  jest.mocked(getPlayers).mockClear();
  const secondVisit = await render(<SearchScreen />);
  await waitFor(() => expect(getPlayers).toHaveBeenCalledWith(user));
  expect(await screen.findByText("Alex Kim")).toBeOnTheScreen();
  await waitFor(() => expect(screen.queryByText("Loading players...")).not.toBeOnTheScreen());

  await userEvent.press(screen.getByRole("tab", { name: "Tournaments" }));
  secondVisit.unmount();
});