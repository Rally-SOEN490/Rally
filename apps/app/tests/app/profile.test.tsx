// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import Profile from "@/app/profile";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

const user = { email: "sam@example.com", displayName: "Sam Lee" } as User;

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
});

it("shows the player's name", async () => {
  await render(<Profile />);
  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
});

it("shows a placeholder name when the player has none", async () => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: { ...user, displayName: null } }));
  await render(<Profile />);

  expect(screen.getByText("Maya Tremblay")).toBeOnTheScreen();
});

it("opens settings from the gear button", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Open settings" }));

  expect(router.push).toHaveBeenCalledWith("/settings");
});

it("goes back Home from the Home tab", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Home" }));

  expect(router.replace).toHaveBeenCalledWith("/home");
});

it("ignores the tabs that aren't built yet", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Events" }));

  expect(router.replace).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
});
