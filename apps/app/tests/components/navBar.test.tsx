// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Animated } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NAV_TABS, NavBar, type NavTabName } from "@/components/navBar";

jest.mock("expo-blur", () => {
  const { View } = jest.requireActual("react-native");
  return { BlurView: (props: object) => <View {...props} /> };
});

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider initialMetrics={metrics}>{children}</SafeAreaProvider>
);

const renderBar = async (active: NavTabName = "home", onSelect = jest.fn()) => {
  const result = await render(<NavBar active={active} onSelect={onSelect} />, { wrapper });
  return { ...result, onSelect };
};

// The bar only knows how wide its tabs are once it has been laid out.
const layOut = (width = 365) =>
  fireEvent(screen.getByTestId("nav-tabs"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 60 } },
  });

it("shows the five tabs in order", async () => {
  await renderBar();

  expect(screen.getAllByRole("tab").map((tab) => tab.props.accessibilityLabel)).toEqual([
    "Home",
    "Events",
    "Search",
    "Notifications",
    "You",
  ]);
});

it.each(NAV_TABS.map((tab) => [tab.name, tab.label] as const))(
  "marks %s as the open tab",
  async (name, label) => {
    await renderBar(name);

    expect(screen.getByRole("tab", { name: label })).toBeSelected();
    expect(screen.getAllByRole("tab", { selected: true })).toHaveLength(1);
  },
);

it.each([
  ["Events", "events"],
  ["Search", "search"],
  ["Notifications", "notifications"],
  ["You", "profile"],
] as const)("goes to the %s screen", async (label, name) => {
  const { onSelect } = await renderBar("home");

  await userEvent.press(screen.getByRole("tab", { name: label }));

  expect(onSelect).toHaveBeenCalledWith(name);
});

it("goes Home from another tab", async () => {
  const { onSelect } = await renderBar("profile");

  await userEvent.press(screen.getByRole("tab", { name: "Home" }));

  expect(onSelect).toHaveBeenCalledWith("home");
});

it("does nothing when the open tab is pressed again", async () => {
  const { onSelect } = await renderBar("search");

  await userEvent.press(screen.getByRole("tab", { name: "Search" }));

  expect(onSelect).not.toHaveBeenCalled();
});

it("only draws the bubble once it knows how wide the tabs are", async () => {
  await renderBar();
  expect(screen.queryByTestId("nav-bubble")).not.toBeOnTheScreen();

  await layOut();

  // 365 wide, minus 4 on each side, shared by 5 tabs, minus 2 = 69.4.
  expect(screen.getByTestId("nav-bubble")).toHaveStyle({ width: 69.4 });
});

it("slides the bubble to the newly opened tab", async () => {
  const spring = jest.spyOn(Animated, "spring");
  const { rerender } = await renderBar("home");
  await layOut();
  // Nothing moves when the bar first appears.
  expect(spring).not.toHaveBeenCalled();

  await rerender(<NavBar active="profile" onSelect={jest.fn()} />);

  // "You" is the fifth tab, so the bubble heads to position 4.
  expect(spring).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 4 }));
  expect(screen.getByTestId("nav-bubble")).toBeOnTheScreen();
});

it("sits above the phone's home indicator", async () => {
  await renderBar();

  expect(screen.getByTestId("nav-bar")).toHaveStyle({ bottom: 34 });
});

it("keeps a gap at the bottom on phones without a home indicator", async () => {
  await render(<NavBar active="home" onSelect={jest.fn()} />, {
    wrapper: ({ children }) => (
      <SafeAreaProvider initialMetrics={{ ...metrics, insets: { ...metrics.insets, bottom: 0 } }}>
        {children}
      </SafeAreaProvider>
    ),
  });

  expect(screen.getByTestId("nav-bar")).toHaveStyle({ bottom: 12 });
});
