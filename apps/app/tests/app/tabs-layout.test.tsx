// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { screen, userEvent } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";
import TabsLayout from "@/app/(tabs)/_layout";

jest.mock("expo-blur", () => {
  const { View } = jest.requireActual("react-native");
  return { BlurView: (props: object) => <View {...props} /> };
});

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
