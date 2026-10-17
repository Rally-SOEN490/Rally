// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { signOut, type User } from "firebase/auth";
import FinishSetup from "@/app/finish-setup";
import { ApiError, saveNewUser } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("firebase/auth", () => ({ signOut: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), saveNewUser: jest.fn() }));

const user = { email: "sam@example.com", emailVerified: true, displayName: "Sam Lee" } as User;
const account = { id: "1", displayName: "Sam Lee", createdAt: "2026-10-17T12:00:00.000Z" };
const setAccount = jest.fn();

const renderFinishSetup = (signedInUser: User | null = user) => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: signedInUser, setAccount }));
  return render(<FinishSetup />);
};

const tickAge = () => userEvent.press(screen.getByRole("checkbox"));
const pressContinue = () => userEvent.press(screen.getByRole("button", { name: "Continue" }));

beforeEach(() => {
  jest.mocked(saveNewUser).mockResolvedValue(account);
});

it("starts with the name from sign-up", async () => {
  await renderFinishSetup();
  expect(screen.getByPlaceholderText("Full Name")).toHaveDisplayValue("Sam Lee");
});

it("limits the name to what the API accepts", async () => {
  await renderFinishSetup({ ...user, displayName: "L".repeat(120) });

  const field = screen.getByPlaceholderText("Full Name");
  expect(field).toHaveProp("maxLength", 100);
  expect(field).toHaveDisplayValue("L".repeat(100));
});

it("starts with an empty name when Firebase has none", async () => {
  await renderFinishSetup({ ...user, displayName: null });
  expect(screen.getByPlaceholderText("Full Name")).toHaveDisplayValue("");
});

it("saves the account, which takes the user Home", async () => {
  await renderFinishSetup();
  await userEvent.clear(screen.getByPlaceholderText("Full Name"));
  await userEvent.type(screen.getByPlaceholderText("Full Name"), "Samantha Lee");
  await tickAge();
  await pressContinue();

  expect(saveNewUser).toHaveBeenCalledWith(user, "Samantha Lee");
  await waitFor(() => expect(setAccount).toHaveBeenCalledWith(account));
});

it("asks for a name", async () => {
  await renderFinishSetup();
  await userEvent.clear(screen.getByPlaceholderText("Full Name"));
  await tickAge();
  await pressContinue();

  expect(alert).toHaveBeenCalledWith("Please enter your name.");
  expect(saveNewUser).not.toHaveBeenCalled();
});

it("stops when the 14-or-older box isn't ticked", async () => {
  await renderFinishSetup();
  await pressContinue();

  expect(alert).toHaveBeenCalledWith("You must be 14 or older to create a Rally account.");
  expect(saveNewUser).not.toHaveBeenCalled();
});

it("shows the server's message when saving fails, so the user can try again", async () => {
  jest.mocked(saveNewUser).mockRejectedValue(new ApiError(0, "Can't reach the Rally server."));
  await renderFinishSetup();
  await tickAge();
  await pressContinue();

  await waitFor(() => expect(alert).toHaveBeenCalledWith("Can't reach the Rally server."));
  expect(setAccount).not.toHaveBeenCalled();
});

it("does nothing if the user logged out meanwhile", async () => {
  await renderFinishSetup(null);
  await tickAge();
  await pressContinue();

  expect(saveNewUser).not.toHaveBeenCalled();
});

it("lets the user log out", async () => {
  await renderFinishSetup();
  await userEvent.press(screen.getByText("Log out"));

  expect(signOut).toHaveBeenCalledWith(auth);
});
