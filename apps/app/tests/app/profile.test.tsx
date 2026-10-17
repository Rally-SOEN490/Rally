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

const user = { email: "sam@example.com", displayName: "Old Firebase name" } as User;
const account = { id: "1", displayName: "Sam Lee", createdAt: "2026-10-17T12:00:00.000Z" };

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account }));
});

it("shows the name saved in Rally's database, like Home does", async () => {
  await render(<Profile />);

  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Old Firebase name")).not.toBeOnTheScreen();
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
