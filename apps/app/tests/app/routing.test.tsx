// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { screen } from "@testing-library/react-native";
import { act, renderRouter } from "expo-router/testing-library";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Text } from "react-native";
import RootLayout from "@/app/_layout";
import Index from "@/app/index";

jest.mock("firebase/auth", () => ({ onAuthStateChanged: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

let reportUser: (user: User | null) => void;

beforeEach(() => {
  jest.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    reportUser = callback as typeof reportUser;
    return jest.fn();
  });
});

// The real layout and index decide where to go. The other screens are
// replaced by simple placeholders so we can see which one is shown.
const renderApp = (initialUrl = "/") =>
  renderRouter(
    {
      _layout: RootLayout,
      index: Index,
      login: () => <Text>Login screen</Text>,
      "sign-up": () => <Text>Sign up screen</Text>,
      "recover-account": () => <Text>Recover account screen</Text>,
      "verify-email": () => <Text>Verify email screen</Text>,
      home: () => <Text>Home screen</Text>,
    },
    { initialUrl },
  );

const signedOut = null;
const unverified = { email: "sam@example.com", emailVerified: false } as User;
const verified = { email: "sam@example.com", emailVerified: true } as User;

const allScreens = [
  "Login screen",
  "Sign up screen",
  "Recover account screen",
  "Verify email screen",
  "Home screen",
];

it("shows no screen while Firebase is still checking who is signed in", async () => {
  await renderApp();
  for (const name of allScreens) expect(screen.queryByText(name)).not.toBeOnTheScreen();
});

it.each([
  ["signed out", signedOut, "Login screen"],
  ["signed in but not verified", unverified, "Verify email screen"],
  ["signed in and verified", verified, "Home screen"],
])("sends a user who is %s to the right screen", async (_, user, expected) => {
  await renderApp();
  await act(async () => reportUser(user));
  expect(await screen.findByText(expected)).toBeOnTheScreen();
});

it.each([
  ["a signed-out user away from Home", "/home", signedOut, "Login screen"],
  ["an unverified user away from Home", "/home", unverified, "Verify email screen"],
  ["a verified user away from Login", "/login", verified, "Home screen"],
  ["a verified user away from Sign up", "/sign-up", verified, "Home screen"],
  ["a signed-out user away from Verify email", "/verify-email", signedOut, "Login screen"],
])("keeps %s when they type the URL", async (_, url, user, expected) => {
  await renderApp(url);
  await act(async () => reportUser(user));
  expect(await screen.findByText(expected)).toBeOnTheScreen();
});

it.each([
  ["/sign-up", "Sign up screen"],
  ["/recover-account", "Recover account screen"],
])("lets a signed-out user open %s", async (url, expected) => {
  await renderApp(url);
  await act(async () => reportUser(signedOut));
  expect(await screen.findByText(expected)).toBeOnTheScreen();
});

it("moves you to Login after logging out", async () => {
  await renderApp();
  await act(async () => reportUser(verified));
  expect(await screen.findByText("Home screen")).toBeOnTheScreen();

  await act(async () => reportUser(signedOut));
  expect(await screen.findByText("Login screen")).toBeOnTheScreen();
});

it("moves you from Login to Verify email after signing up", async () => {
  await renderApp();
  await act(async () => reportUser(signedOut));
  expect(await screen.findByText("Login screen")).toBeOnTheScreen();

  await act(async () => reportUser(unverified));
  expect(await screen.findByText("Verify email screen")).toBeOnTheScreen();
});

it("moves you to Home once your email is verified", async () => {
  await renderApp();
  await act(async () => reportUser(unverified));
  expect(await screen.findByText("Verify email screen")).toBeOnTheScreen();

  await act(async () => reportUser(verified));
  expect(await screen.findByText("Home screen")).toBeOnTheScreen();
});
