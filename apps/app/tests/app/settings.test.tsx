// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User,
  type UserCredential,
} from "firebase/auth";
import { Alert, Platform } from "react-native";
import Settings from "@/app/settings";
import { ApiError, deleteMyAccount } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { back: jest.fn(), replace: jest.fn() } }));
jest.mock("firebase/auth", () => ({
  deleteUser: jest.fn(),
  EmailAuthProvider: { credential: jest.fn(() => "the-credential") },
  reauthenticateWithCredential: jest.fn(),
  signOut: jest.fn(),
  updatePassword: jest.fn(),
  verifyBeforeUpdateEmail: jest.fn(),
}));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), deleteMyAccount: jest.fn() }));

const user = { email: "sam@example.com" } as User;

beforeEach(() => {
  Object.assign(auth, { currentUser: user });
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(signOut).mockResolvedValue();
  jest.mocked(reauthenticateWithCredential).mockResolvedValue({} as UserCredential);
  jest.mocked(deleteMyAccount).mockResolvedValue();
  jest.mocked(deleteUser).mockResolvedValue();
  jest.mocked(updatePassword).mockResolvedValue();
  jest.mocked(verifyBeforeUpdateEmail).mockResolvedValue();
});

// On phones the confirmation is an Alert. Pretend the user presses `answer`.
const answerConfirmation = (answer: "Cancel" | "Yes, delete my account" | "dismiss") =>
  jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons, options) => {
    if (answer === "dismiss") options?.onDismiss?.();
    else buttons?.find((button) => button.text === answer)?.onPress?.();
  });

const pressDelete = () => userEvent.press(screen.getByRole("button", { name: "Delete account" }));

// Goes through the confirmation and types the password into the prompt.
const openPasswordPrompt = async (password = "secret123") => {
  answerConfirmation("Yes, delete my account");
  await pressDelete();
  await userEvent.type(await screen.findByPlaceholderText("Password"), password);
};

const confirmDeletion = () =>
  userEvent.press(screen.getByRole("button", { name: "Delete my account" }));

// Helpers for the change e-mail / change password form.
const typeInto = (placeholder: string, text: string) =>
  userEvent.type(screen.getByPlaceholderText(placeholder), text);
const save = () => userEvent.press(screen.getByText("Save"));
const openEmailForm = () => userEvent.press(screen.getByText("sam@example.com"));
const openPasswordForm = () => userEvent.press(screen.getByText("Change"));

it("shows the user's own email", async () => {
  await render(<Settings />);
  expect(screen.getByText("sam@example.com")).toBeOnTheScreen();
});

it("goes back from the back button", async () => {
  await render(<Settings />);
  await userEvent.press(screen.getByRole("button", { name: "Back" }));

  expect(router.back).toHaveBeenCalled();
});

describe("preferences", () => {
  it("turns the switches on and off", async () => {
    await render(<Settings />);
    const switches = screen.getAllByRole("switch");
    expect(switches.map((toggle) => toggle.props.value)).toEqual([true, true, false]);

    for (const toggle of switches) await fireEvent(toggle, "valueChange", !toggle.props.value);

    expect(screen.getAllByRole("switch").map((toggle) => toggle.props.value)).toEqual([false, false, true]);
  });

  it("switches the language between English and French", async () => {
    await render(<Settings />);

    await userEvent.press(screen.getByText("FR"));
    await userEvent.press(screen.getByText("EN"));

    expect(screen.getByText("EN")).toBeOnTheScreen();
  });
});

describe("log out", () => {
  it("logs out and goes to Login", async () => {
    await render(<Settings />);
    await userEvent.press(screen.getByRole("button", { name: "Log out" }));

    expect(signOut).toHaveBeenCalledWith(auth);
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("explains when logging out fails", async () => {