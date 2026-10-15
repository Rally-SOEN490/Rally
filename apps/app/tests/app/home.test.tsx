// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import { signOut, type User } from "firebase/auth";
import Home from "@/app/home";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

jest.mock("firebase/auth", () => ({ signOut: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue({
    user: { email: "sam@example.com" } as User,
    isLoading: false,
    refresh: jest.fn(),
  });
});

it("shows who is logged in", async () => {
  await render(<Home />);
  expect(screen.getByText("Logged in as sam@example.com")).toBeOnTheScreen();
});

it("logs the user out", async () => {
  jest.mocked(signOut).mockResolvedValue();
  await render(<Home />);
  await userEvent.press(screen.getByRole("button", { name: "Log out" }));

  expect(signOut).toHaveBeenCalledWith(auth);
});
