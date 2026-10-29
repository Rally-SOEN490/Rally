// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from "@testing-library/react-native";
import { router } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
  type UserCredential,
} from "firebase/auth";
import { Alert, Platform } from "react-native";
import Settings from "@/app/settings";
import { clearAccountDeleted, wasAccountJustDeleted } from "@/lib/account-deleted";
import {
  ApiError,
  deleteMyAccount,
  getMyGender,
  type RallyUser,
  saveMyGender,
  updateMyAccount,
} from "@/lib/api";
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
  updateProfile: jest.fn(),
  verifyBeforeUpdateEmail: jest.fn(),
}));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  deleteMyAccount: jest.fn(),
  getMyGender: jest.fn(),
  saveMyGender: jest.fn(),
  updateMyAccount: jest.fn(),
}));

const user = { email: "sam@example.com" } as User;
const account = {
  id: "1",
  displayName: "Sam Lee",
  lookingForTeam: false,
  createdAt: "2026-10-17T12:00:00.000Z",
  badges: [],
} as RallyUser;
const setAccount = jest.fn();

beforeEach(() => {
  clearAccountDeleted();
  Object.assign(auth, { currentUser: user });
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account, setAccount }));
  jest.mocked(signOut).mockResolvedValue();
  jest.mocked(reauthenticateWithCredential).mockResolvedValue({} as UserCredential);
  jest.mocked(deleteMyAccount).mockResolvedValue();
  jest.mocked(getMyGender).mockResolvedValue({ gender: null });
  jest.mocked(saveMyGender).mockImplementation(async (_user, gender) => ({ gender }));
  jest.mocked(updateMyAccount).mockResolvedValue({} as never);
  jest.mocked(updateProfile).mockResolvedValue();
  jest.mocked(deleteUser).mockResolvedValue();
  jest.mocked(updatePassword).mockResolvedValue();
  jest.mocked(verifyBeforeUpdateEmail).mockResolvedValue();
});

// Shows Settings for someone whose saved Rally account is `savedAccount`.
const renderSettings = (savedAccount: RallyUser = account) => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account: savedAccount, setAccount }));
  return render(<Settings />);
};

// The popup that's open, and helpers to use it.
const dialog = () => within(screen.getByTestId("dialog"));
const pressInDialog = (name: string) => userEvent.press(dialog().getByRole("button", { name }));
const tapOutside = () => fireEvent.press(screen.getByTestId("dialog-backdrop"));
const expectNoDialog = () => expect(screen.queryByTestId("dialog")).not.toBeOnTheScreen();

const typeInto = (placeholder: string, text: string) =>
  userEvent.type(screen.getByPlaceholderText(placeholder), text);
const openRow = (name: "Name" | "E-mail" | "Password") =>
  userEvent.press(screen.getByRole("button", { name }));
const save = () => pressInDialog("Save");

const switchValues = () =>
  screen.getAllByRole("switch").map((toggle) => toggle.props.value as boolean);

it("shows the user's name and e-mail", async () => {
  await renderSettings();

  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.getByText("sam@example.com")).toBeOnTheScreen();
});

it("goes back from the back button", async () => {
  jest.mocked(router.canGoBack).mockReturnValue(true);
  await renderSettings();
  await userEvent.press(screen.getByRole("button", { name: "Back" }));

  expect(router.back).toHaveBeenCalled();
});

it("goes to Profile from the back button when there's nothing to go back to", async () => {
  jest.mocked(router.canGoBack).mockReturnValue(false);
  await renderSettings();
  await userEvent.press(screen.getByRole("button", { name: "Back" }));

  expect(router.back).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith("/profile");
});

describe("change name", () => {
  it("opens with the current name filled in", async () => {
    await renderSettings();
    await openRow("Name");

    expect(dialog().getByText("Change name")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Full name")).toHaveDisplayValue("Sam Lee");
  });

  it("saves the new name to Rally's database and Firebase", async () => {
    const updated = { ...account, displayName: "Sam Park" };
    jest.mocked(updateMyAccount).mockResolvedValue(updated);
    await renderSettings();
    await openRow("Name");
    await userEvent.clear(screen.getByPlaceholderText("Full name"));
    await typeInto("Full name", "  Sam Park ");
    await save();

    await waitFor(() => expect(setAccount).toHaveBeenCalledWith(updated));
    expect(updateMyAccount).toHaveBeenCalledWith(user, { displayName: "Sam Park" });
    expect(updateProfile).toHaveBeenCalledWith(user, { displayName: "Sam Park" });
    expectNoDialog();
  });

  it("just closes when the name didn't change", async () => {
    await renderSettings();
    await openRow("Name");
    await save();

    expect(updateMyAccount).not.toHaveBeenCalled();
    expectNoDialog();
  });

  it("can't save a blank name", async () => {
    await renderSettings();
    await openRow("Name");
    await userEvent.clear(screen.getByPlaceholderText("Full name"));
    await typeInto("Full name", "   ");

    expect(dialog().getByRole("button", { name: "Save" })).toBeDisabled();
    await save();
    expect(updateMyAccount).not.toHaveBeenCalled();
  });

  it("shows the API's error and keeps the popup open", async () => {
    jest.mocked(updateMyAccount).mockRejectedValue(new ApiError(500, "Unable to save."));
    await renderSettings();
    await openRow("Name");
    await typeInto("Full name", " Jr");
    await save();

    expect(await dialog().findByText("Unable to save.")).toBeOnTheScreen();
    expect(setAccount).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("still saves when Firebase's copy of the name can't be updated", async () => {
    jest.mocked(updateProfile).mockRejectedValue(new Error("Network error"));
    await renderSettings();
    await openRow("Name");
    await typeInto("Full name", " Jr");
    await save();

    await waitFor(() => expect(setAccount).toHaveBeenCalled());
    expectNoDialog();
  });
});

describe("change e-mail", () => {
  it("opens the e-mail form (without a confirm field) when the row is tapped", async () => {
    await renderSettings();
    await openRow("E-mail");

    expect(dialog().getByText("Change e-mail")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Current password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("New e-mail address")).toBeOnTheScreen();
    expect(screen.queryByPlaceholderText("Confirm new password")).not.toBeOnTheScreen();
  });

  it("re-checks the password, sends a verification link, then confirms it was sent", async () => {
    await renderSettings();
    await openRow("E-mail");
    await typeInto("Current password", "oldpass1");
    await typeInto("New e-mail address", "  new@example.com ");
    await save();

    expect(await screen.findByText("Verification email sent")).toBeOnTheScreen();
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "oldpass1");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, "the-credential");
    expect(verifyBeforeUpdateEmail).toHaveBeenCalledWith(user, "new@example.com");
    expect(updatePassword).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("New e-mail address")).not.toBeOnTheScreen();

    await pressInDialog("OK");
    expectNoDialog();
  });

  it("refuses the e-mail the user already has, ignoring capital letters", async () => {
    await renderSettings();
    await openRow("E-mail");
    await typeInto("Current password", "oldpass1");
    await typeInto("New e-mail address", "SAM@example.com");
    await save();

    expect(await screen.findByText("That's already your e-mail.")).toBeOnTheScreen();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
  });

  it("shows a friendly message and keeps the form open when the password is wrong", async () => {
    jest
      .mocked(reauthenticateWithCredential)
      .mockRejectedValue({ code: "auth/invalid-credential" });
    await renderSettings();
    await openRow("E-mail");
    await typeInto("Current password", "wrong");
    await typeInto("New e-mail address", "new@example.com");
    await save();

    expect(await screen.findByText("Wrong email or password.")).toBeOnTheScreen();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("New e-mail address")).toBeOnTheScreen();
  });
});

describe("change password", () => {
  it("opens the password form (with a confirm field) when the row is tapped", async () => {
    await renderSettings();
    await openRow("Password");

    expect(dialog().getByText("Change password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Current password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("New password")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Confirm new password")).toBeOnTheScreen();
  });

  it("stops when the two new passwords don't match", async () => {
    await renderSettings();
    await openRow("Password");
    await typeInto("Current password", "oldpass1");
    await typeInto("New password", "newpass1");
    await typeInto("Confirm new password", "different");
    await save();

    expect(await screen.findByText("Passwords don't match.")).toBeOnTheScreen();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("re-checks the old password, saves the new one, then confirms it changed", async () => {
    await renderSettings();
    await openRow("Password");
    await typeInto("Current password", "oldpass1");
    await typeInto("New password", "newpass1");
    await typeInto("Confirm new password", "newpass1");
    await save();

    expect(await screen.findByText("Password changed")).toBeOnTheScreen();
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "oldpass1");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, "the-credential");
    expect(updatePassword).toHaveBeenCalledWith(user, "newpass1");
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("New password")).not.toBeOnTheScreen();
  });

  it("closes the confirmation when tapping outside it", async () => {
    await renderSettings();
    await openRow("Password");
    await typeInto("Current password", "oldpass1");
    await typeInto("New password", "newpass1");
    await typeInto("Confirm new password", "newpass1");
    await save();
    await screen.findByText("Password changed");

    await tapOutside();
    expectNoDialog();
  });

  it("shows a friendly message when Firebase says the new password is too weak", async () => {
    jest.mocked(updatePassword).mockRejectedValue({ code: "auth/weak-password" });
    await renderSettings();
    await openRow("Password");
    await typeInto("Current password", "oldpass1");
    await typeInto("New password", "abc");
    await typeInto("Confirm new password", "abc");
    await save();

    expect(
      await screen.findByText("Your password must be at least 6 characters long."),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Password changed")).not.toBeOnTheScreen();
    expect(screen.getByPlaceholderText("New password")).toBeOnTheScreen();
  });
});

describe("both change forms", () => {
  it("does nothing on Save until every field is filled in", async () => {
    await renderSettings();
    await openRow("E-mail");
    await typeInto("New e-mail address", "new@example.com");

    expect(dialog().getByRole("button", { name: "Save" })).toBeDisabled();
    await save();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(verifyBeforeUpdateEmail).not.toHaveBeenCalled();
  });

  it("closes and clears everything when Cancel is pressed", async () => {
    await renderSettings();
    await openRow("E-mail");
    await typeInto("Current password", "oldpass1");
    await typeInto("New e-mail address", "new@example.com");
    await pressInDialog("Cancel");

    expectNoDialog();

    await openRow("E-mail");
    expect(screen.getByPlaceholderText("Current password")).toHaveDisplayValue("");
    expect(screen.getByPlaceholderText("New e-mail address")).toHaveDisplayValue("");
  });

  it("stays open when tapping outside, so typed text isn't lost", async () => {
    await renderSettings();
    await openRow("E-mail");
    await typeInto("New e-mail address", "new@example.com");
    await tapOutside();

    expect(screen.getByPlaceholderText("New e-mail address")).toHaveDisplayValue("new@example.com");
  });
});

describe("preferences", () => {
  it("starts with the defaults when nothing has been saved", async () => {
    await renderSettings();

    // Notifications, colour blind mode, dark mode.
    expect(switchValues()).toEqual([true, false, false]);
    expect(screen.getByRole("radio", { name: "EN" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Green" })).toBeChecked();
  });

  it("shows the saved settings", async () => {
    await renderSettings({
      ...account,
      notificationsEnabled: false,
      language: "FR",
      colorTheme: "pink",
      colorBlindMode: true,
      darkMode: true,
    });

    expect(switchValues()).toEqual([false, true, true]);
    expect(screen.getByRole("radio", { name: "FR" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Pink" })).toBeChecked();
  });

  it("saves each switch as soon as it changes", async () => {
    const saved = { ...account, darkMode: true };
    jest.mocked(updateMyAccount).mockResolvedValue(saved);
    await renderSettings();
    const [notifications, colorBlind, dark] = screen.getAllByRole("switch");

    await fireEvent(notifications, "valueChange", false);
    await fireEvent(colorBlind, "valueChange", true);
    await fireEvent(dark, "valueChange", true);

    expect(switchValues()).toEqual([false, true, true]);
    expect(updateMyAccount).toHaveBeenCalledWith(user, { notificationsEnabled: false });
    expect(updateMyAccount).toHaveBeenCalledWith(user, { colorBlindMode: true });
    expect(updateMyAccount).toHaveBeenCalledWith(user, { darkMode: true });
    await waitFor(() => expect(setAccount).toHaveBeenCalledWith(saved));
  });

  it("saves the language", async () => {
    await renderSettings();
    await userEvent.press(screen.getByRole("radio", { name: "FR" }));

    expect(updateMyAccount).toHaveBeenCalledWith(user, { language: "FR" });
    expect(screen.getByRole("radio", { name: "FR" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "EN" })).not.toBeChecked();
  });

  it("saves the colour theme and makes the selected colour bigger", async () => {
    await renderSettings();
    expect(screen.getByRole("radio", { name: "Green" })).toHaveStyle({ width: 28 });
    expect(screen.getByRole("radio", { name: "Pink" })).toHaveStyle({ width: 18 });

    await userEvent.press(screen.getByRole("radio", { name: "Pink" }));

    expect(updateMyAccount).toHaveBeenCalledWith(user, { colorTheme: "pink" });
    expect(screen.getByRole("radio", { name: "Pink" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Pink" })).toHaveStyle({ width: 28 });
    expect(screen.getByRole("radio", { name: "Green" })).toHaveStyle({ width: 18 });
  });

  it("puts a setting back and explains when saving it fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(updateMyAccount).mockRejectedValue(new ApiError(500, "Unable to save."));
    await renderSettings();

    await fireEvent(screen.getAllByRole("switch")[2], "valueChange", true);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to save setting", "Unable to save."),
    );
    expect(switchValues()).toEqual([true, false, false]);
    expect(setAccount).not.toHaveBeenCalled();
  });

  it("puts the colour back when saving it fails", async () => {
    jest.spyOn(Alert, "alert");
    jest.mocked(updateMyAccount).mockRejectedValue(new ApiError(500, "Unable to save."));
    await renderSettings();

    await userEvent.press(screen.getByRole("radio", { name: "Blue" }));

    await waitFor(() => expect(screen.getByRole("radio", { name: "Green" })).toBeChecked());
    expect(screen.getByRole("radio", { name: "Blue" })).not.toBeChecked();
  });
});

describe("gender and social media", () => {
  it("saves the selected gender and can clear it", async () => {
    await renderSettings();

    await userEvent.press(screen.getByRole("radio", { name: "Female" }));
    expect(saveMyGender).toHaveBeenCalledWith(user, "female");

    await userEvent.press(screen.getByRole("button", { name: "Clear gender" }));
    expect(saveMyGender).toHaveBeenLastCalledWith(user, null);
  });

  it("restores the previous gender when saving fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(saveMyGender).mockRejectedValue(new ApiError(500, "Unable to save."));
    await renderSettings();

    await userEvent.press(screen.getByRole("radio", { name: "Female" }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to save gender", "Unable to save."),
    );
    expect(screen.getByRole("radio", { name: "Female" })).not.toBeChecked();
  });

  it("shows an error when loading gender fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(getMyGender).mockRejectedValue(new ApiError(503, "Unable to load."));

    await renderSettings();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to load gender", "Unable to load."),
    );
  });

  it("saves Instagram and Facebook links", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(updateMyAccount).mockResolvedValue({
      ...account,
      instagramUrl: "https://instagram.com/sam",
      facebookUrl: "https://facebook.com/sam",
    });
    await renderSettings();

    await userEvent.type(screen.getByLabelText("Instagram link"), "https://instagram.com/sam");
    await userEvent.press(screen.getByRole("button", { name: "Save Instagram link" }));
    await userEvent.type(screen.getByLabelText("Facebook link"), "https://facebook.com/sam");
    await userEvent.press(screen.getByRole("button", { name: "Save Facebook link" }));

    expect(updateMyAccount).toHaveBeenNthCalledWith(1, user, {
      instagramUrl: "https://instagram.com/sam",
    });
    expect(updateMyAccount).toHaveBeenNthCalledWith(2, user, {
      facebookUrl: "https://facebook.com/sam",
    });
    expect(alertSpy).toHaveBeenCalledWith(
      "Social media saved",
      "Your Facebook link is now shown on your profile.",
    );
  });

  it("rejects invalid social media links", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    await renderSettings();

    await userEvent.type(screen.getByLabelText("Instagram link"), "https://example.com/sam");
    await userEvent.press(screen.getByRole("button", { name: "Save Instagram link" }));
    await userEvent.type(screen.getByLabelText("Facebook link"), "https://example.com/sam");
    await userEvent.press(screen.getByRole("button", { name: "Save Facebook link" }));

    expect(updateMyAccount).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      "Invalid Facebook link",
      "Use a link like https://facebook.com/yourusername.",
    );
  });

  it("shows an API error when saving a social link fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    jest.mocked(updateMyAccount).mockRejectedValue(new ApiError(500, "Unable to save."));
    await renderSettings();

    await userEvent.type(screen.getByLabelText("Instagram link"), "https://instagram.com/sam");
    await userEvent.press(screen.getByRole("button", { name: "Save Instagram link" }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to save Instagram", "Unable to save."),
    );
  });
});

describe("log out", () => {
  const pressLogOut = () => userEvent.press(screen.getByRole("button", { name: "Log out" }));

  it("asks first instead of logging out straight away", async () => {
    await renderSettings();
    await pressLogOut();

    expect(dialog().getByText("Log out?")).toBeOnTheScreen();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("stays logged in after Cancel", async () => {
    await renderSettings();
    await pressLogOut();
    await pressInDialog("Cancel");

    expectNoDialog();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("stays logged in after tapping outside the popup", async () => {
    await renderSettings();
    await pressLogOut();
    await tapOutside();

    expectNoDialog();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("logs out and goes to Login once confirmed", async () => {
    await renderSettings();
    await pressLogOut();
    await pressInDialog("Log out");

    expect(signOut).toHaveBeenCalledWith(auth);
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("explains in the popup when logging out fails", async () => {
    jest.mocked(signOut).mockRejectedValue(new Error("Network error"));
    await renderSettings();
    await pressLogOut();
    await pressInDialog("Log out");

    expect(
      await dialog().findByText("Unable to log out. Please try again in a moment."),
    ).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("delete account", () => {
  const pressDelete = () => userEvent.press(screen.getByRole("button", { name: "Delete account" }));

  // Opens the popup and types the e-mail and password into it.
  const fillDeleteForm = async (email = "sam@example.com", password = "secret123") => {
    await pressDelete();
    await typeInto("E-mail address", email);
    await typeInto("Password", password);
  };
  const confirmDeletion = () => pressInDialog("Delete account");

  it("asks for the e-mail and password in Rally's own popup", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    await renderSettings();
    await pressDelete();

    expect(dialog().getByText("Delete account?")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("E-mail address")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Password")).toBeOnTheScreen();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(deleteMyAccount).not.toHaveBeenCalled();
  });

  it("can't be confirmed until both fields are filled in", async () => {
    await renderSettings();
    await pressDelete();
    await typeInto("Password", "secret123");

    expect(dialog().getByRole("button", { name: "Delete account" })).toBeDisabled();
  });

  it("stays open when tapping outside, so nothing is deleted by accident", async () => {
    await renderSettings();
    await fillDeleteForm();
    await tapOutside();

    expect(screen.getByPlaceholderText("Password")).toHaveDisplayValue("secret123");
    expect(deleteMyAccount).not.toHaveBeenCalled();
  });

  it("deletes Rally's data and the login in one go, then goes to Sign up", async () => {
    await renderSettings();
    await fillDeleteForm();
    await confirmDeletion();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-up"));
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("sam@example.com", "secret123");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, "the-credential");
    expect(deleteMyAccount).toHaveBeenCalledWith(user);
    expect(deleteUser).toHaveBeenCalledWith(user);
    expect(jest.mocked(deleteMyAccount).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(deleteUser).mock.invocationCallOrder[0],
    );
    // Sign up reads this to show "Account deleted".
    expect(wasAccountJustDeleted()).toBe(true);
  });

  it("accepts the e-mail with different capitals and extra spaces", async () => {
    await renderSettings();
    await fillDeleteForm("  SAM@Example.com ");
    await confirmDeletion();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-up"));
    expect(deleteUser).toHaveBeenCalledWith(user);
  });

  it("deletes nothing when the e-mail isn't the account's", async () => {
    await renderSettings();
    await fillDeleteForm("someone@example.com");
    await confirmDeletion();

    expect(await screen.findByText("That e-mail doesn't match your account.")).toBeOnTheScreen();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(deleteMyAccount).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("deletes nothing when the password is wrong", async () => {
    jest
      .mocked(reauthenticateWithCredential)
      .mockRejectedValue({ code: "auth/invalid-credential" });
    await renderSettings();
    await fillDeleteForm("sam@example.com", "wrong");
    await confirmDeletion();

    expect(await screen.findByText("Wrong email or password.")).toBeOnTheScreen();
    expect(deleteMyAccount).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("shows 'Deleting…' while it works", async () => {
    jest.mocked(deleteMyAccount).mockReturnValue(new Promise(() => {}));
    await renderSettings();
    await fillDeleteForm();
    await confirmDeletion();

    expect(await dialog().findByRole("button", { name: "Deleting…" })).toBeDisabled();
  });

  it("keeps the Firebase login when Rally's data can't be deleted", async () => {
    jest
      .mocked(deleteMyAccount)
      .mockRejectedValue(new ApiError(0, "Can't reach the Rally server."));
    await renderSettings();
    await fillDeleteForm();
    await confirmDeletion();

    expect(await dialog().findByText("Can't reach the Rally server.")).toBeOnTheScreen();
    expect(deleteUser).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(wasAccountJustDeleted()).toBe(false);
    expect(dialog().getByRole("button", { name: "Delete account" })).toBeEnabled();
  });

  it("explains when the login can't be deleted, and stays on Settings", async () => {
    jest.mocked(deleteUser).mockRejectedValue(new Error("Network error"));
    await renderSettings();
    await fillDeleteForm();
    await confirmDeletion();

    expect(
      await dialog().findByText(
        "Your Rally data was deleted, but your login couldn't be removed. Please try again.",
      ),
    ).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
    expect(wasAccountJustDeleted()).toBe(false);
    expect(dialog().getByRole("button", { name: "Delete account" })).toBeEnabled();
  });

  it("finishes the job when they try again after the login couldn't be deleted", async () => {
    jest.mocked(deleteUser).mockRejectedValueOnce(new Error("Network error"));
    await renderSettings();
    await fillDeleteForm();
    await confirmDeletion();
    await dialog().findByText(
      "Your Rally data was deleted, but your login couldn't be removed. Please try again.",
    );

    await confirmDeletion();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-up"));
    expect(deleteMyAccount).toHaveBeenCalledTimes(2);
    expect(deleteUser).toHaveBeenCalledTimes(2);
  });

  it("closes the popup and forgets what was typed on Cancel", async () => {
    await renderSettings();
    await fillDeleteForm();
    await pressInDialog("Cancel");
    expectNoDialog();

    await pressDelete();
    expect(screen.getByPlaceholderText("E-mail address")).toHaveDisplayValue("");
    expect(screen.getByPlaceholderText("Password")).toHaveDisplayValue("");
  });

  it("does nothing when nobody is logged in", async () => {
    await renderSettings();
    await fillDeleteForm();
    Object.assign(auth, { currentUser: null });
    await confirmDeletion();

    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(deleteMyAccount).not.toHaveBeenCalled();
  });
});

describe("on the web", () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "web");
    globalThis.confirm = jest.fn(() => true);
  });

  it("uses Rally's popups instead of the browser's confirm dialog", async () => {
    await renderSettings();

    await userEvent.press(screen.getByRole("button", { name: "Delete account" }));
    expect(dialog().getByText("Delete account?")).toBeOnTheScreen();
    await pressInDialog("Cancel");

    await userEvent.press(screen.getByRole("button", { name: "Log out" }));
    expect(dialog().getByText("Log out?")).toBeOnTheScreen();

    expect(confirm).not.toHaveBeenCalled();
  });

  it("shows errors with the browser's alert", async () => {
    jest.mocked(updateMyAccount).mockRejectedValue(new ApiError(500, "Unable to save."));
    await renderSettings();

    await fireEvent(screen.getAllByRole("switch")[2], "valueChange", true);

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("Unable to save setting\n\nUnable to save."),
    );
  });
});
