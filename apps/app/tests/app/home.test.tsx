// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import { signOut, type User } from "firebase/auth";
import Home from "@/app/home";
import { ApiError, getMyAccount } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

jest.mock("firebase/auth", () => ({ signOut: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), getMyAccount: jest.fn() }));

const user = { email: "sam@example.com" } as User;
const account = { id: "1", displayName: "Sam Lee", createdAt: "2026-10-17T12:00:00.000Z" };

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue({ user, isLoading: false, refresh: jest.fn() });
  jest.mocked(getMyAccount).mockResolvedValue(account);
});

it("shows who is logged in", async () => {
  await render(<Home />);
  expect(screen.getByText("Logged in as sam@example.com")).toBeOnTheScreen();
});

it("greets the user with their name from Rally's database", async () => {
  await render(<Home />);

  const memberSince = new Date(account.createdAt).toLocaleDateString();
  expect(await screen.findByText(`Welcome, Sam Lee! Member since ${memberSince}.`)).toBeOnTheScreen();
  expect(getMyAccount).toHaveBeenCalledWith(user);
});

it("shows a loading message until the account arrives", async () => {
  jest.mocked(getMyAccount).mockReturnValue(new Promise(() => {}));
  await render(<Home />);

  expect(screen.getByText("Loading your Rally account…")).toBeOnTheScreen();
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

it("doesn't ask the API for an account when nobody is logged in", async () => {
  jest.mocked(useSession).mockReturnValue({ user: null, isLoading: false, refresh: jest.fn() });
  await render(<Home />);

  expect(getMyAccount).not.toHaveBeenCalled();
});

it("logs the user out", async () => {
  jest.mocked(signOut).mockResolvedValue();
  await render(<Home />);
  await userEvent.press(screen.getByRole("button", { name: "Log out" }));

  expect(signOut).toHaveBeenCalledWith(auth);
});
