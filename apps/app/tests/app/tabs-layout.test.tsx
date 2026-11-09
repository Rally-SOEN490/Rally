// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { screen, userEvent } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";
import type { User } from "firebase/auth";
import SearchScreen from "@/app/(tabs)/search";
import { getPlayers } from "@/lib/api";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";
import TabsLayout from "@/app/(tabs)/_layout";

jest.mock("expo-blur", () => {
  const { View } = jest.requireActual("react-native");
  return { BlurView: (props: object) => <View {...props} /> };
});

jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/search-fonts", () => ({ useSearchFonts: () => ({}) }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), getPlayers: jest.fn() }));

// Stand-ins for the real screens: this checks the navigation, not the pages.
const page = (title: string) =>
  function Page() {
    return <Text>{title} page</Text>;
  };

const renderTabs = (initialUrl = "/home") =>
  renderRouter(
    {
      "(tabs)/_layout": TabsLayout,
      "(tabs)/home": page("Home"),
      "(tabs)/events": page("Events"),
      "(tabs)/search": page("Search"),
      "(tabs)/notifications": page("Notifications"),
      "(tabs)/profile": page("Profile"),
    },
    { initialUrl },
  );

it("opens on the page in the address, with its tab selected", async () => {
  await renderTabs("/search");

  expect(screen.getByText("Search page")).toBeOnTheScreen();
  expect(screen.getByRole("tab", { name: "Search" })).toBeSelected();
});

it.each([
  ["Events", "Events page"],
  ["Search", "Search page"],
  ["Notifications", "Notifications page"],
  ["You", "Profile page"],
])("opens %s from its tab", async (tab, text) => {
  await renderTabs("/home");

  await userEvent.press(screen.getByRole("tab", { name: tab }));

  expect(screen.getByText(text)).toBeOnTheScreen();
  expect(screen.getByRole("tab", { name: tab })).toBeSelected();
});

it("goes back Home from another tab", async () => {
  await renderTabs("/profile");

  await userEvent.press(screen.getByRole("tab", { name: "Home" }));

  expect(screen.getByText("Home page")).toBeOnTheScreen();
  expect(screen.getByRole("tab", { name: "Home" })).toBeSelected();
});

it("keeps player browsing and its query inside the single shared navigation bar", async () => {
  const user = { getIdToken: jest.fn() } as unknown as User;
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(getPlayers).mockResolvedValue([
    { id: "1", displayName: "Alex Kim", lookingForTeam: true, createdAt: "2026-10-17", badges: [] },
    { id: "2", displayName: "Sam Lee", lookingForTeam: false, createdAt: "2026-10-17", badges: [] },
  ]);
  await renderRouter(
    {
      "(tabs)/_layout": TabsLayout,
      "(tabs)/home": page("Home"),
      "(tabs)/events": page("Events"),
      "(tabs)/search": SearchScreen,
      "(tabs)/notifications": page("Notifications"),
      "(tabs)/profile": page("Profile"),
    },
    { initialUrl: "/home" },
  );
  await userEvent.press(screen.getByRole("tab", { name: "Search" }));
  await userEvent.press(screen.getByRole("tab", { name: "Players" }));
  expect(await screen.findByText("Alex Kim")).toBeOnTheScreen();
  await userEvent.type(screen.getByPlaceholderText("Search players by name"), "sAM");
  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Kim")).not.toBeOnTheScreen();
  expect(screen.getAllByTestId("nav-bar")).toHaveLength(1);
  await userEvent.press(screen.getByRole("tab", { name: "Home" }));
  expect(screen.getByText("Home page")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("tab", { name: "Search" }));
  expect(screen.getByPlaceholderText("Search players by name")).toHaveDisplayValue("sAM");
  expect(screen.getByRole("tab", { name: "Players" })).toBeSelected();
  expect(screen.getByRole("tab", { name: "Search" })).toBeSelected();
  expect(screen.getByRole("button", { name: "Message: Sam Lee" })).toBeDisabled();
  expect(screen.getAllByTestId("nav-bar")).toHaveLength(1);
  expect(getPlayers).toHaveBeenCalledTimes(1);
});
