// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { screen, userEvent } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { signInWithEmailAndPassword, type UserCredential } from "firebase/auth";
import { Text } from "react-native";
import Login from "@/app/login";
import { auth } from "@/lib/firebase";

jest.mock("firebase/auth", () => ({ signInWithEmailAndPassword: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

const renderLogin = () =>
  renderRouter(
    {
      login: Login,
      "recover-account": () => <Text>Recover account screen</Text>,
      "sign-up": () => <Text>Sign up screen</Text>,
    },
    { initialUrl: "/login" },
  );

const fillInAndSubmit = async () => {
  await userEvent.type(screen.getByPlaceholderText("E-mail address"), "sam@example.com");
  await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");
  await userEvent.press(screen.getByRole("button", { name: "Log in" }));
};

it("logs in with the email and password typed", async () => {
  jest.mocked(signInWithEmailAndPassword).mockResolvedValue({} as UserCredential);
  await renderLogin();
  await fillInAndSubmit();

  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, "sam@example.com", "secret123");
  expect(alert).not.toHaveBeenCalled();
});

it("shows a friendly message when the password is wrong", async () => {
  jest.mocked(signInWithEmailAndPassword).mockRejectedValue({ code: "auth/invalid-credential" });
  await renderLogin();
  await fillInAndSubmit();

  expect(alert).toHaveBeenCalledWith("Wrong email or password.");
});

it("links to Recover account", async () => {
  await renderLogin();
  await userEvent.press(screen.getByText("Forgot?"));
  expect(await screen.findByText("Recover account screen")).toBeOnTheScreen();
});

it("links to Sign up", async () => {
  await renderLogin();
  await userEvent.press(screen.getByText("Sign up"));
  expect(await screen.findByText("Sign up screen")).toBeOnTheScreen();
});
