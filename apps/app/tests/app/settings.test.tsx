// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
  type AuthCredential,
  type User,
  type UserCredential,
} from "firebase/auth";
import { Alert } from "react-native";
import Settings from "@/app/settings";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

jest.mock("firebase/auth", () => ({
  deleteUser: jest.fn(),
  signOut: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
  verifyBeforeUpdateEmail: jest.fn(),
  EmailAuthProvider: { credential: jest.fn() },
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock("@/lib/firebase", () => ({
  auth: { currentUser: { email: "sam@example.com" } },
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

const credential = { providerId: "password" } as AuthCredential;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSession).mockReturnValue({
    user: { email: "sam@example.com" } as User,
    isLoading: false,
    refresh: jest.fn(),
  });
  jest.mocked(EmailAuthProvider.credential).mockReturnValue(credential);
  jest.mocked(reauthenticateWithCredential).mockResolvedValue({} as UserCredential);
  jest.mocked(updatePassword).mockResolvedValue();
  jest.mocked(verifyBeforeUpdateEmail).mockResolvedValue();
});

const type = (placeholder: string, text: string) =>
  userEvent.type(screen.getByPlaceholderText(placeholder), text);
const save = () => userEvent.press(screen.getByText("Save"));
const openEmailForm = () => userEvent.press(screen.getByText("sam@example.com"));
const openPasswordForm = () => userEvent.press(screen.getByText("Change"));

describe("Change e-mail", () => {
  it("shows the signed-in user's real e-mail on the row", async () => {
    await render(<Settings />);
    expect(screen.getByText("sam@example.com")).toBeOnTheScreen();
  });

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
    await type("Current password", "oldpass1");
    await type("New e-mail address", "  new@example.com ");
    await save();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Check your new inbox",
        expect.stringContaining("new@example.com"),
      ),
    );
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "oldpass1");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(auth.currentUser, credential);
    expect(verifyBeforeUpdateEmail).toHaveBeenCalledWith(auth.currentUser, "new@example.com");
    expect(updatePassword).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("New e-mail address")).not.toBeOnTheScreen();
  });

  it("refuses the e-mail the user already has, ignoring capital letters", async () => {
    await render(<Settings />);
    await openEmailForm();
    await type("Current password", "oldpass1");
    await type("New e-mail address", "SAM@example.com");
    await save();

    expect(await screen.findByText("That's already your e-mail.")).toBeOnTheScreen();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
  });

  it("shows a friendly message and keeps the form open when the password is wrong", async () => {
    jest
      .mocked(reauthenticateWithCredential)
      .mockRejectedValue({ code: "auth/invalid-credential" });
    await render(<Settings />);
    await openEmailForm();
    await type("Current password", "wrong");
    await type("New e-mail address", "new@example.com");
    await save();

    expect(await screen.findByText("Wrong email or password.")).toBeOnTheScreen();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("New e-mail address")).toBeOnTheScreen();
  });
});

describe("Change password", () => {
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
    await type("Current password", "oldpass1");
    await type("New password", "newpass1");
    await type("Confirm new password", "different");
    await save();

    expect(await screen.findByText("Passwords don't match.")).toBeOnTheScreen();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("re-checks the old password, then saves the new one", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    await render(<Settings />);
    await openPasswordForm();
    await type("Current password", "oldpass1");
    await type("New password", "newpass1");
    await type("Confirm new password", "newpass1");
    await save();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Password updated", "Your password has been changed."),
    );
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "oldpass1");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(auth.currentUser, credential);
    expect(updatePassword).toHaveBeenCalledWith(auth.currentUser, "newpass1");
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("New password")).not.toBeOnTheScreen();
  });

  it("shows a friendly message when Firebase says the new password is too weak", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(updatePassword).mockRejectedValue({ code: "auth/weak-password" });
    await render(<Settings />);
    await openPasswordForm();
    await type("Current password", "oldpass1");
    await type("New password", "abc");
    await type("Confirm new password", "abc");
    await save();

    expect(
      await screen.findByText("Your password must be at least 6 characters long."),
    ).toBeOnTheScreen();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("New password")).toBeOnTheScreen();
  });
});

describe("Both forms", () => {
  it("does nothing on Save until every field is filled in", async () => {
    await render(<Settings />);
    await openEmailForm();
    await type("New e-mail address", "new@example.com");
    await save();

    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
  });

  it("closes and clears everything when Cancel is pressed", async () => {
    await render(<Settings />);
    await openEmailForm();
    await type("Current password", "oldpass1");
    await type("New e-mail address", "new@example.com");
    await userEvent.press(screen.getByText("Cancel"));

    expect(screen.queryByPlaceholderText("Current password")).not.toBeOnTheScreen();

    await openEmailForm();
    expect(screen.getByPlaceholderText("Current password")).toHaveDisplayValue("");
    expect(screen.getByPlaceholderText("New e-mail address")).toHaveDisplayValue("");
  });
});