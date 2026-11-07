// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { screen, userEvent } from "@testing-library/react-native";
import { router, Tabs } from "expo-router";
import { act, renderRouter } from "expo-router/testing-library";
import type { User } from "firebase/auth";
import { Text } from "react-native";
import SearchScreen from "@/app/(tabs)/search";
import { getTournaments, type Tournament } from "@/lib/tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

// The real tab navigator, which keeps Search loaded while another tab is open.
// Coming back to Search must still load tournaments published in the meantime.

jest.setTimeout(20_000);

jest.mock("@/lib/search-fonts", () => ({
  useSearchFonts: () => ({
    regular: "InterRegular",
    medium: "InterMedium",
    semibold: "InterSemiBold",
  }),
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/tournaments", () => ({
  ...jest.requireActual("@/lib/tournaments"),
  getTournaments: jest.fn(),
}));

const tournament = (id: string, name: string): Tournament => ({
  id,
  name,
  location: "Verdun Auditorium",
  startsAt: "2027-11-15T09:00",
  endsAt: "2027-11-15T19:00",
  registrationOpensAt: "2027-10-20T12:00",
  registrationClosesAt: "2027-11-09T23:59",
  organizerName: "Verdun Volley",
  divisions: [
    {
      id: `${id}-division`,
      name: "6v6 Co-ed B",
      format: "6v6",
      type: "coed",
      levels: ["B"],
      maxTeams: 10,
      priceCents: 24000,
      registeredTeams: 0,
    },
  ],
});

const winterCup = tournament("winter", "Verdun Winter Cup");
const springCup = tournament("spring", "Verdun Spring Cup");

// Search and Events as tabs, starting on Search.
const openSearch = async () => {
  await renderRouter(
    {
      "(tabs)/_layout": () => <Tabs screenOptions={{ headerShown: false }} />,
      "(tabs)/search": SearchScreen,
      "(tabs)/events": () => <Text>Events screen</Text>,
    },
    { initialUrl: "/search" },
  );
  await screen.findByText("Verdun Winter Cup");
};

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: {} as User }));
  jest.mocked(getTournaments).mockReset().mockResolvedValueOnce([winterCup]);
});

it("lists a tournament published while another tab was open", async () => {
  await openSearch();
  await userEvent.type(
    screen.getByPlaceholderText("Search for events, venue, organizer"),
    "verdun",
  );

  await act(async () => router.navigate("/events"));
  expect(await screen.findByText("Events screen")).toBeOnTheScreen();
  jest.mocked(getTournaments).mockResolvedValueOnce([winterCup, springCup]);
  await act(async () => router.navigate("/search"));

  expect(await screen.findByText("Verdun Spring Cup")).toBeOnTheScreen();
  expect(screen.getByText("Verdun Winter Cup")).toBeOnTheScreen();
  // Search stayed loaded: the text typed before leaving is still there.
  expect(screen.getByDisplayValue("verdun")).toBeOnTheScreen();
  expect(getTournaments).toHaveBeenCalledTimes(2);
});

it("keeps the results on screen while they reload", async () => {
  await openSearch();
  await act(async () => router.navigate("/events"));
  jest.mocked(getTournaments).mockReturnValueOnce(new Promise(() => {}));
  await act(async () => router.navigate("/search"));

  expect(screen.getByText("Verdun Winter Cup")).toBeOnTheScreen();
  expect(screen.queryByText("Loading tournaments…")).not.toBeOnTheScreen();
});

it("doesn't reload while Search is out of view", async () => {
  await openSearch();

  await act(async () => router.navigate("/events"));
  await screen.findByText("Events screen");

  expect(getTournaments).toHaveBeenCalledTimes(1);
});
