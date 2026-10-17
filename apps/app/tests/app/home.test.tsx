// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { deleteUser, signOut, type User } from "firebase/auth";
import { router } from "expo-router";
import Home from "@/app/home";
import Profile from "@/app/profile";
import Settings from "@/app/settings";
import { ApiError, getMyAccount } from "@/lib/api";
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
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), getMyAccount: jest.fn() }));

const user = { email: "sam@example.com", displayName: "Sam from Firebase" } as User;
const account = { id: "1", displayName: "Sam Lee", createdAt: "2026-10-17T12:00:00.000Z" };

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue({ user, isLoading: false, refresh: jest.fn() });
  jest.mocked(getMyAccount).mockResolvedValue(account);
});

describe("Home", () => {
  it("shows the redesigned home page and opens the profile from the You tab", async () => {
    await render(<Home />);

    expect(screen.getByText("Welcome back,")).toBeOnTheScreen();
    expect(screen.getByText("Upcoming Match")).toBeOnTheScreen();
    await userEvent.press(screen.getByRole("button", { name: "You" }));

    expect(router.push).toHaveBeenCalledWith("/profile");
  });

  it("greets the user with their name from Rally's database", async () => {
    await render(<Home />);

    const memberSince = new Date(account.createdAt).toLocaleDateString();
    expect(await screen.findByText(`Member since ${memberSince}`)).toBeOnTheScreen();
    expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
    expect(getMyAccount).toHaveBeenCalledWith(user);
  });

  it("shows the Firebase name until the account arrives", async () => {
    jest.mocked(getMyAccount).mockReturnValue(new Promise(() => {}));
    await render(<Home />);

    expect(screen.getByText("Sam from Firebase")).toBeOnTheScreen();
  });

  it("falls back to a placeholder name when there is none", async () => {
    jest.mocked(useSession).mockReturnValue({ user: null, isLoading: false, refresh: jest.fn() });
    await render(<Home />);

    expect(screen.getByText("Chau")).toBeOnTheScreen();
    expect(getMyAccount).not.toHaveBeenCalled();
  });

  it("says so when the database has no account for this login", async () => {
    jest.mocked(getMyAccount).mockResolvedValue(null);
    await render(<Home />);

    expect(await screen.findByText("We couldn't find your Rally account.")).toBeOnTheScreen();
  });

  it("shows the server's message when the account can't be loaded", async () => {
    jest.mocked(getMyAccount).mockRejectedValue(new ApiError(401, "Log in to continue."));
    await render(<Home />);

    expect(await screen.findByText("Log in to continue.")).toBeOnTheScreen();
  });

  it("shows a general message for unexpected errors", async () => {
    jest.mocked(getMyAccount).mockRejectedValue(new Error("Something broke"));
    await render(<Home />);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeOnTheScreen();
  });
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
    "Are you sure you want to delete your account? This can't be undone.",
    expect.any(Array),
    expect.anything(),
  );

  const buttonSet = alertSpy.mock.calls[0]?.[2] ?? [];
  const confirmAction = buttonSet.find((button) => button?.text === "Yes, delete my account");

  await confirmAction?.onPress?.();

  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  expect(deleteUser).toHaveBeenCalledWith(auth.currentUser);
});
