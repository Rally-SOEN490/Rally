// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { sendPasswordResetEmail } from "firebase/auth";
import { Text } from "react-native";
import RecoverAccount from "@/app/recover-account";
import { auth } from "@/lib/firebase";

jest.mock("firebase/auth", () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

const renderRecoverAccount = () =>
  renderRouter(
    { "recover-account": RecoverAccount, login: () => <Text>Login screen</Text> },
    { initialUrl: "/recover-account" },
  );

const requestReset = async () => {
  await userEvent.type(screen.getByPlaceholderText("E-mail address"), "sam@example.com");
  await userEvent.press(screen.getByRole("button", { name: "Reset Password" }));
};

it("sends a reset link to the email typed", async () => {
  jest.mocked(sendPasswordResetEmail).mockResolvedValue();
  await renderRecoverAccount();
  await requestReset();

  expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, "sam@example.com");
  await waitFor(() => expect(alert).toHaveBeenCalledWith("Check your e-mail for a reset link"));
});

it("shows a friendly message when the email is invalid", async () => {
  jest.mocked(sendPasswordResetEmail).mockRejectedValue({ code: "auth/invalid-email" });
  await renderRecoverAccount();
  await requestReset();

  await waitFor(() => expect(alert).toHaveBeenCalledWith("That email address doesn't look right."));
});

it("links back to Login", async () => {
  await renderRecoverAccount();
  await userEvent.press(screen.getByText("log in"));
  expect(await screen.findByText("Login screen")).toBeOnTheScreen();
});
