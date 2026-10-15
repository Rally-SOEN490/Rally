// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";
import { Text } from "react-native";
import SignUp from "@/app/sign-up";
import { auth } from "@/lib/firebase";

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
}));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

const newUser = { email: "sam@example.com" } as User;

beforeEach(() => {
  jest.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user: newUser } as UserCredential);
  jest.mocked(updateProfile).mockResolvedValue();
  jest.mocked(sendEmailVerification).mockResolvedValue();
});

const renderSignUp = () =>
  renderRouter(
    { "sign-up": SignUp, login: () => <Text>Login screen</Text> },
    { initialUrl: "/sign-up" },
  );

const fillInForm = async ({ confirmPassword = "secret123", tickAge = true } = {}) => {
  await userEvent.type(screen.getByPlaceholderText("Full Name"), "Sam Lee");
  await userEvent.type(screen.getByPlaceholderText("E-mail address"), "sam@example.com");
  await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");
  await userEvent.type(screen.getByPlaceholderText("Confirm Password"), confirmPassword);
  if (tickAge) await userEvent.press(screen.getByRole("checkbox"));
};

const submit = () => userEvent.press(screen.getByRole("button", { name: "Sign up" }));

it("creates the account, saves the name and sends the verification email", async () => {
  await renderSignUp();
  await fillInForm();
  await submit();

  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, "sam@example.com", "secret123");
  expect(updateProfile).toHaveBeenCalledWith(newUser, { displayName: "Sam Lee" });
  expect(sendEmailVerification).toHaveBeenCalledWith(newUser);
  expect(alert).not.toHaveBeenCalled();
});

it("stops when the passwords don't match", async () => {
  await renderSignUp();
  await fillInForm({ confirmPassword: "different" });
  await submit();

  expect(alert).toHaveBeenCalledWith("Passwords don't match");
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
});

it("stops when the 14-or-older box isn't ticked", async () => {
  await renderSignUp();
  await fillInForm({ tickAge: false });
  await submit();

  expect(alert).toHaveBeenCalledWith("You must be 14 or older to create a Rally account.");
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
});

it("shows a friendly message when the email is already used", async () => {
  jest.mocked(createUserWithEmailAndPassword).mockRejectedValue({ code: "auth/email-already-in-use" });
  await renderSignUp();
  await fillInForm();
  await submit();

  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith(
      "An account with this email already exists. Try logging in instead.",
    ),
  );
  expect(sendEmailVerification).not.toHaveBeenCalled();
});

it("shows a friendly message when the verification email can't be sent", async () => {
  jest.mocked(sendEmailVerification).mockRejectedValue({ code: "auth/network-request-failed" });
  await renderSignUp();
  await fillInForm();
  await submit();

  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith(
      "Can't reach the server. Check your internet connection and try again.",
    ),
  );
});

it("links to Login", async () => {
  await renderSignUp();
  await userEvent.press(screen.getByText("Log in"));
  expect(await screen.findByText("Login screen")).toBeOnTheScreen();
});
