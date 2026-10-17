// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import { deleteUser, signOut, type User } from "firebase/auth";
import { router } from "expo-router";
import Home from "@/app/home";
import Profile from "@/app/profile";
import Settings from "@/app/settings";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

jest.mock("firebase/auth", () => ({
  deleteUser: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/firebase", () => ({
  auth: { currentUser: { uid: "abc123" } },
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue({
    user: { email: "sam@example.com" } as User,
    isLoading: false,
    refresh: jest.fn(),
  });
  jest.clearAllMocks();
});

it("shows the redesigned home page and opens the profile from the You tab", async () => {
  await render(<Home />);

  expect(screen.getByText("Welcome back,")).toBeOnTheScreen();
  expect(screen.getByText("Upcoming Match")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "You" }));

  expect(router.push).toHaveBeenCalledWith("/profile");
});

it("opens settings from the profile gear action", async () => {
  await render(<Profile />);

  await userEvent.press(screen.getByRole("button", { name: "Open settings" }));
  expect(router.push).toHaveBeenCalledWith("/settings");
});

it("asks for confirmation and deletes the account when confirmed", async () => {
  jest.mocked(deleteUser).mockResolvedValue();
  jest.mocked(signOut).mockResolvedValue();
  const alertSpy = jest.spyOn(Alert, "alert");

  await render(<Settings />);
  await userEvent.press(screen.getByRole("button", { name: "Delete account" }));

  expect(alertSpy).toHaveBeenCalledWith(
    "Delete account",
    expect.stringContaining("Are you sure they want to delete the account?"),
    expect.any(Array),
  );

  const buttonSet = alertSpy.mock.calls[0]?.[2] ?? [];
  const confirmAction = buttonSet.find(
    (button: { text?: string; onPress?: () => void }) =>
      button?.text === "Yes, delete my account",
  );

  await confirmAction?.onPress?.();

  expect(deleteUser).toHaveBeenCalledWith(auth.currentUser);
  expect(signOut).toHaveBeenCalledWith(auth);
  expect(router.replace).toHaveBeenCalledWith("/login");
});
