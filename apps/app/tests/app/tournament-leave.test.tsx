// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { screen, userEvent } from "@testing-library/react-native";
import { router, Stack } from "expo-router";
import { act, renderRouter } from "expo-router/testing-library";
import type { User } from "firebase/auth";
import { Text } from "react-native";
import { SetupScreen } from "@/components/tournaments/setupScreen";
import { createTournament, type OrganizerTournament } from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

// The real navigator, so this checks that a back navigation is actually held
// back. Android's back button and the iOS swipe go through the same check.

jest.setTimeout(20_000);

jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/organizer-tournaments", () => ({
  ...jest.requireActual("@/lib/organizer-tournaments"),
  createTournament: jest.fn(),
}));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: {} as User }));
  jest.mocked(createTournament).mockResolvedValue({ id: "t1", name: "Cup" } as OrganizerTournament);
});

// Events, then the setup screen opened on top of it.
const openSetup = async () => {
  await renderRouter(
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      index: () => <Text>Home screen</Text>,
      events: () => <Text>Events screen</Text>,
      "tournaments/new": () => <SetupScreen />,
    },
    { initialUrl: "/events" },
  );
  await act(async () => router.push("/tournaments/new"));
  await screen.findByLabelText("Tournament name");
};

it("holds back a back navigation while there are unsaved changes", async () => {
  await openSetup();
  await userEvent.type(screen.getByLabelText("Tournament name"), "Verdun Winter Cup");

  await act(async () => router.back());

  expect(screen.getByText("Leave without saving?")).toBeOnTheScreen();
  expect(screen.getByLabelText("Tournament name")).toBeOnTheScreen();
});

it("goes back once the organizer chooses to leave", async () => {
  await openSetup();
  await userEvent.type(screen.getByLabelText("Tournament name"), "Verdun Winter Cup");
  await act(async () => router.back());

  await userEvent.press(screen.getByRole("button", { name: "Leave" }));

  expect(await screen.findByText("Events screen")).toBeOnTheScreen();
  expect(createTournament).not.toHaveBeenCalled();
});

it("goes back without asking when nothing changed", async () => {
  await openSetup();

  await act(async () => router.back());

  expect(await screen.findByText("Events screen")).toBeOnTheScreen();
  expect(screen.queryByText("Leave without saving?")).not.toBeOnTheScreen();
});

it("leaves without asking after Save draft", async () => {
  await openSetup();
  await userEvent.type(screen.getByLabelText("Tournament name"), "Verdun Winter Cup");

  await userEvent.press(screen.getByRole("button", { name: "Save draft" }));

  expect(await screen.findByText("Events screen")).toBeOnTheScreen();
  expect(screen.queryByText("Leave without saving?")).not.toBeOnTheScreen();
});
