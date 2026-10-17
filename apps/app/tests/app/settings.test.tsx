// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
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
    jest.mocked(signOut).mockRejectedValue(new Error("Network error"));
    const alertSpy = jest.spyOn(Alert, "alert");
    await render(<Settings />);
    await userEvent.press(screen.getByRole("button", { name: "Log out" }));

    expect(alertSpy).toHaveBeenCalledWith("Unable to log out", "Please try again in a moment.");
  });
});

describe("delete account", () => {
  it("asks for confirmation first", async () => {
    const alertSpy = answerConfirmation("Cancel");
    await render(<Settings />);
    await pressDelete();

    expect(alertSpy).toHaveBeenCalledWith(
      "Delete account",
      "Are you sure you want to delete your account? This can't be undone.",
      expect.any(Array),
      expect.objectContaining({ cancelable: true }),
    );
  });

  it.each(["Cancel", "dismiss"] as const)("does nothing after %s", async (answer) => {
    answerConfirmation(answer);
    await render(<Settings />);
    await pressDelete();

    expect(screen.queryByPlaceholderText("Password")).not.toBeOnTheScreen();
    expect(deleteMyAccount).not.toHaveBeenCalled();
  });

  it("checks the password, then deletes from Rally's database and then from Firebase", async () => {
    await render(<Settings />);
    await openPasswordPrompt();
    await confirmDeletion();

    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "secret123");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, "the-credential");
    expect(deleteMyAccount).toHaveBeenCalledWith(user);
    expect(deleteUser).toHaveBeenCalledWith(user);
    expect(jest.mocked(deleteMyAccount).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(deleteUser).mock.invocationCallOrder[0],
    );
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("shows 'Deleting…' while it works", async () => {
    jest.mocked(deleteMyAccount).mockReturnValue(new Promise(() => {}));
    await render(<Settings />);
    await openPasswordPrompt();
    await confirmDeletion();

    expect(screen.getAllByText(/Deleting…/)).toHaveLength(2);
  });

  it("deletes nothing when the password is wrong", async () => {
    jest.mocked(reauthenticateWithCredential).mockRejectedValue({ code: "auth/invalid-credential" });
    await render(<Settings />);
    await openPasswordPrompt("wrong");
    await confirmDeletion();

    expect(await screen.findByText("Wrong email or password.")).toBeOnTheScreen();
    expect(deleteMyAccount).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("keeps the Firebase login when Rally's data can't be deleted", async () => {
    jest.mocked(deleteMyAccount).mockRejectedValue(new ApiError(0, "Can't reach the Rally server."));
    const alertSpy = answerConfirmation("Yes, delete my account");
    await render(<Settings />);
    await openPasswordPrompt();
    await confirmDeletion();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to delete account", "Can't reach the Rally server."),
    );
    expect(deleteUser).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete my account" })).toBeEnabled();
  });

  it("explains when Firebase can't delete the login", async () => {
    jest.mocked(deleteUser).mockRejectedValue(new Error("Network error"));
    const alertSpy = answerConfirmation("Yes, delete my account");
    await render(<Settings />);
    await openPasswordPrompt();
    await confirmDeletion();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Unable to delete account",
        "Something went wrong. Please try again.",
      ),
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("closes the password prompt and forgets the password on Cancel", async () => {
    await render(<Settings />);
    await openPasswordPrompt();
    await userEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("Password")).not.toBeOnTheScreen();

    await pressDelete();
    expect(await screen.findByPlaceholderText("Password")).toHaveDisplayValue("");
  });

  it("does nothing when nobody is logged in", async () => {
    await render(<Settings />);
    await openPasswordPrompt();
    Object.assign(auth, { currentUser: null });
    await confirmDeletion();

    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(deleteMyAccount).not.toHaveBeenCalled();
  });
});

describe("on the web", () => {
  // Alert.alert with buttons does nothing on the web, so the screen uses the browser's dialogs.
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "web");
  });

  it("asks for confirmation with the browser's dialog", async () => {
    globalThis.confirm = jest.fn(() => true);
    await render(<Settings />);
    await pressDelete();

    expect(confirm).toHaveBeenCalledWith(
      "Delete account\n\nAre you sure you want to delete your account? This can't be undone.",
    );
    expect(await screen.findByPlaceholderText("Password")).toBeOnTheScreen();
  });

  it("shows errors with the browser's alert", async () => {
    jest.mocked(signOut).mockRejectedValue(new Error("Network error"));
    await render(<Settings />);
    await userEvent.press(screen.getByRole("button", { name: "Log out" }));

    expect(alert).toHaveBeenCalledWith("Unable to log out\n\nPlease try again in a moment.");
  });
});
