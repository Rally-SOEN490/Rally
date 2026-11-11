// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

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
} from "firebase/auth";
import { apiErrorMessage, deleteMyAccount, updateMyAccount, type RallyUser } from "@/lib/api";
import { clearAccountDeleted, markAccountDeleted } from "@/lib/account-deleted";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import type { DialogForm } from "./useDialogForm";

// What the popups on the Settings screen do when confirmed. Each one reads what
// was typed from the dialog form and reports problems through it.

const reauthenticate = (user: User, password: string) =>
  reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? "", password));

// Marks the popup busy while the action runs, and shows its error if it fails.
const runDialogAction = async (
  form: DialogForm,
  action: () => Promise<void>,
  toMessage: (error: unknown) => string,
) => {
  form.setBusy(true);
  form.setError("");
  try {
    await action();
  } catch (error) {
    form.setError(toMessage(error));
  } finally {
    form.setBusy(false);
  }
};

export const saveName = async (
  form: DialogForm,
  displayName: string,
  setAccount: (account: RallyUser) => void,
) => {
  const current = auth.currentUser;
  const name = form.newValue.trim();
  if (!current || !name) return;
  if (name === displayName) return form.close();

  await runDialogAction(
    form,
    async () => {
      const updated = await updateMyAccount(current, { displayName: name });
      // Keep Firebase's copy in step too. Rally's database is what other
      // screens read, so a failure here isn't worth an error.
      await updateProfile(current, { displayName: name }).catch(() => {});
      setAccount(updated);
      form.setDialog(null);
      form.resetFields();
    },
    apiErrorMessage,
  );
};

export const saveEmail = async (form: DialogForm) => {
  const current = auth.currentUser;
  if (!current?.email) return;
  const value = form.newValue.trim();
  if (value.toLowerCase() === current.email.toLowerCase()) {
    form.setError("That's already your e-mail.");
    return;
  }

  await runDialogAction(
    form,
    async () => {
      await reauthenticate(current, form.currentPassword);
      await verifyBeforeUpdateEmail(current, value);
      form.resetFields();
      form.setDialog("emailSent");
    },
    authErrorMessage,
  );
};

export const savePassword = async (form: DialogForm) => {
  const current = auth.currentUser;
  if (!current?.email) return;
  if (form.newValue !== form.confirmValue) {
    form.setError("Passwords don't match.");
    return;
  }

  await runDialogAction(
    form,
    async () => {
      await reauthenticate(current, form.currentPassword);
      await updatePassword(current, form.newValue);
      form.resetFields();
      form.setDialog("passwordChanged");
    },
    authErrorMessage,
  );
};

export const logOut = async (form: DialogForm) => {
  form.setBusy(true);
  try {
    await signOut(auth);
    router.replace("/login");
  } catch {
    form.setBusy(false);
    form.setError("Unable to log out. Please try again in a moment.");
  }
};

// Runs one step of the account deletion. If it fails, shows the error, stops
// the busy state and returns false so the caller can stop.
const deletionStep = async (
  form: DialogForm,
  step: () => Promise<unknown>,
  toMessage: (error: unknown) => string,
) => {
  try {
    await step();
    return true;
  } catch (error) {
    form.setError(toMessage(error));
    form.setBusy(false);
    return false;
  }
};

// Deletes everything in one go: checks the e-mail and password, deletes the
// account from Rally's database, then deletes the Firebase login (which also
// logs them out) and goes to Sign up, which says the account was deleted.
export const deleteAccount = async (form: DialogForm) => {
  const current = auth.currentUser;
  if (!current?.email) return;
  if (form.deleteEmail.trim().toLowerCase() !== current.email.toLowerCase()) {
    form.setError("That e-mail doesn't match your account.");
    return;
  }

  form.setBusy(true);
  form.setError("");
  // Firebase only deletes logins that signed in recently, so check the
  // password first. This way Firebase can't refuse the deletion below.
  if (
    !(await deletionStep(
      form,
      () => reauthenticate(current, form.currentPassword),
      authErrorMessage,
    ))
  )
    return;
  // If this fails, nothing was deleted, so they can simply try again.
  if (!(await deletionStep(form, () => deleteMyAccount(current), apiErrorMessage))) return;

  const loginDeleted = await deletionStep(
    form,
    async () => {
      // Set before deleting: logging out can move them away from this screen
      // before the line after deleteUser runs.
      markAccountDeleted();
      await deleteUser(current); // also logs them out
    },
    () => {
      clearAccountDeleted();
      // Deleting Rally's data again is safe, so pressing Delete again finishes the job.
      return "Your Rally data was deleted, but your login couldn't be removed. Please try again.";
    },
  );
  if (!loginDeleted) return;

  // Sign up only opens once the session has noticed the log-out, so wait a tick.
  setTimeout(() => router.replace("/sign-up"), 0);
};
