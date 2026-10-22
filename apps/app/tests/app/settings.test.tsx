/*
AI declaration:
50% or more AI-generated
*/

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
import { ApiError, deleteMyAccount, getMyGender, saveMyGender } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.setTimeout(20_000);

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(), replace: jest.fn() },
}));
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
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  deleteMyAccount: jest.fn(),
  getMyGender: jest.fn(),
  saveMyGender: jest.fn(),
}));

const user = { email: "sam@example.com" } as User;

beforeEach(() => {
  Object.assign(auth, { currentUser: user });
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(signOut).mockResolvedValue();
  jest.mocked(reauthenticateWithCredential).mockResolvedValue({} as UserCredential);
  jest.mocked(deleteMyAccount).mockResolvedValue();
  jest.mocked(getMyGender).mockResolvedValue({ gender: null });
  jest.mocked(saveMyGender).mockImplementation(async (_user, gender) => ({ gender }));
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
  jest.mocked(router.canGoBack).mockReturnValue(true);
  await render(<Settings />);
  await userEvent.press(screen.getByRole("button", { name: "Back" }));

  expect(router.back).toHaveBeenCalled();
});

it("goes to Profile from the back button when there's nothing to go back to", async () => {
  jest.mocked(router.canGoBack).mockReturnValue(false);
  await render(<Settings />);
  await userEvent.press(screen.getByRole("button", { name: "Back" }));

  expect(router.back).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith("/profile");
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

  it("saves the selected gender and can clear it", async () => {
    await render(<Settings />);

    await userEvent.press(screen.getByRole("radio", { name: "Female" }));
    expect(saveMyGender).toHaveBeenCalledWith(user, "female");

    await userEvent.press(screen.getByRole("button", { name: "Clear gender" }));
    expect(saveMyGender).toHaveBeenLastCalledWith(user, null);
  });

  it("restores the previous gender when saving fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(saveMyGender).mockRejectedValue(new ApiError(500, "Unable to save."));
    await render(<Settings />);

    await userEvent.press(screen.getByRole("radio", { name: "Female" }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to save gender", "Unable to save."),
    );
    expect(screen.getByRole("radio", { name: "Female" })).not.toHaveProp("accessibilityState.checked", true);
  });

  it("shows an error when loading gender fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(getMyGender).mockRejectedValue(new ApiError(503, "Unable to load."));

    await render(<Settings />);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to load gender", "Unable to load."),
    );
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

describe("change e-mail", () => {
  it("opens the e-mail form (without a confirm field) when the row is tapped", async () => {
    await render(<Settings />);
    await openEmailForm();

    expect(screen.getByText("Change e-mail")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Current password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("New e-mail address")).toBeOnTheScreen();
    expect(screen.queryByPlaceholderText("Confirm new password")).not.toBeOnTheScreen();
  });

  it("re-checks the password, then sends a verification link to the new e-mail", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    await render(<Settings />);
    await openEmailForm();
    await typeInto("Current password", "oldpass1");
    await typeInto("New e-mail address", "  new@example.com ");
    await save();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Check your new inbox",
        expect.stringContaining("new@example.com"),
      ),
    );
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "oldpass1");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, "the-credential");
    expect(verifyBeforeUpdateEmail).toHaveBeenCalledWith(user, "new@example.com");
    expect(updatePassword).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("New e-mail address")).not.toBeOnTheScreen();
  });

  it("refuses the e-mail the user already has, ignoring capital letters", async () => {
    await render(<Settings />);
    await openEmailForm();
    await typeInto("Current password", "oldpass1");
    await typeInto("New e-mail address", "SAM@example.com");
    await save();

    expect(await screen.findByText("That's already your e-mail.")).toBeOnTheScreen();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
  });

  it("shows a friendly message and keeps the form open when the password is wrong", async () => {
    jest.mocked(reauthenticateWithCredential).mockRejectedValue({ code: "auth/invalid-credential" });
    await render(<Settings />);
    await openEmailForm();
    await typeInto("Current password", "wrong");
    await typeInto("New e-mail address", "new@example.com");
    await save();

    expect(await screen.findByText("Wrong email or password.")).toBeOnTheScreen();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("New e-mail address")).toBeOnTheScreen();
  });
});

describe("change password", () => {
  it("opens the password form (with a confirm field) when Change is tapped", async () => {
    await render(<Settings />);
    await openPasswordForm();

    expect(screen.getByText("Change password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Current password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("New password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Confirm new password")).toBeOnTheScreen();
  });

  it("stops when the two new passwords don't match", async () => {
    await render(<Settings />);
    await openPasswordForm();
    await typeInto("Current password", "oldpass1");
    await typeInto("New password", "newpass1");
    await typeInto("Confirm new password", "different");
    await save();

    expect(await screen.findByText("Passwords don't match.")).toBeOnTheScreen();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("re-checks the old password, then saves the new one", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    await render(<Settings />);
    await openPasswordForm();
    await typeInto("Current password", "oldpass1");
    await typeInto("New password", "newpass1");
    await typeInto("Confirm new password", "newpass1");
    await save();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Password updated", "Your password has been changed."),
    );
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "oldpass1");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, "the-credential");
    expect(updatePassword).toHaveBeenCalledWith(user, "newpass1");
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("New password")).not.toBeOnTheScreen();
  });

  it("shows a friendly message when Firebase says the new password is too weak", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(updatePassword).mockRejectedValue({ code: "auth/weak-password" });
    await render(<Settings />);
    await openPasswordForm();
    await typeInto("Current password", "oldpass1");
    await typeInto("New password", "abc");
    await typeInto("Confirm new password", "abc");
    await save();

    expect(
      await screen.findByText("Your password must be at least 6 characters long."),
    ).toBeOnTheScreen();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("New password")).toBeOnTheScreen();
  });
});

describe("both change forms", () => {
  it("does nothing on Save until every field is filled in", async () => {
    await render(<Settings />);
    await openEmailForm();
    await typeInto("New e-mail address", "new@example.com");
    await save();

    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
  });

  it("closes and clears everything when Cancel is pressed", async () => {
    await render(<Settings />);
    await openEmailForm();
    await typeInto("Current password", "oldpass1");
    await typeInto("New e-mail address", "new@example.com");
    await userEvent.press(screen.getByText("Cancel"));

    expect(screen.queryByPlaceholderText("Current password")).not.toBeOnTheScreen();

    await openEmailForm();
    expect(screen.getByPlaceholderText("Current password")).toHaveDisplayValue("");
    expect(screen.getByPlaceholderText("New e-mail address")).toHaveDisplayValue("");
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