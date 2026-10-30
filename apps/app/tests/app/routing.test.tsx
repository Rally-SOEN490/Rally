// Copyright (c) 2026 Rally. All rights reserved.

import { screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { act, renderRouter } from "expo-router/testing-library";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Text } from "react-native";
import TabsLayout from "@/app/(tabs)/_layout";
import RootLayout from "@/app/_layout";
import Index from "@/app/index";
import { ApiError, getMyAccount, type RallyUser } from "@/lib/api";
import { auth } from "@/lib/firebase";

jest.mock("firebase/auth", () => ({ onAuthStateChanged: jest.fn(), signOut: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), getMyAccount: jest.fn() }));
jest.mock("expo-blur", () => {
  const { View } = jest.requireActual("react-native");
  return { BlurView: (props: object) => <View {...props} /> };
});

const account = {
  id: "1",
  displayName: "Sam Lee",
  lookingForTeam: false,
  createdAt: "2026-10-17T12:00:00.000Z",
  badges: [],
};

let reportUser: (user: User | null) => void;

beforeEach(() => {
  jest.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    reportUser = callback as typeof reportUser;
    return jest.fn();
  });
  jest.mocked(getMyAccount).mockResolvedValue(account);
});

// The real layouts and index decide where to go. The other screens are
// replaced by simple placeholders so we can see which one is shown. Like the
// real app, the main screens sit in the (tabs) folder with the nav bar.
const renderApp = (initialUrl = "/") =>
  renderRouter(
    {
      _layout: RootLayout,
      index: Index,
      login: () => <Text>Login screen</Text>,
      "sign-up": () => <Text>Sign up screen</Text>,
      "recover-account": () => <Text>Recover account screen</Text>,
      "verify-email": () => <Text>Verify email screen</Text>,
      "finish-setup": () => <Text>Finish setup screen</Text>,
      "(tabs)/_layout": TabsLayout,
      "(tabs)/home": () => <Text>Home screen</Text>,
      "(tabs)/events": () => <Text>Events screen</Text>,
      "(tabs)/search": () => <Text>Search screen</Text>,
      "(tabs)/notifications": () => <Text>Notifications screen</Text>,
      "(tabs)/profile": () => <Text>Profile screen</Text>,
      settings: () => <Text>Settings screen</Text>,
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
  "Finish setup screen",
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
  ["a signed-out user away from Profile", "/profile", signedOut, "Login screen"],
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

describe("the Rally account", () => {
  it("waits for the account before showing Home", async () => {
    jest.mocked(getMyAccount).mockReturnValue(new Promise(() => {}));
    await renderApp();
    await act(async () => reportUser(verified));

    for (const name of allScreens) expect(screen.queryByText(name)).not.toBeOnTheScreen();
  });

  it("sends a verified user without an account to Finish setup", async () => {
    jest.mocked(getMyAccount).mockResolvedValue(null);
    await renderApp();
    await act(async () => reportUser(verified));

    expect(await screen.findByText("Finish setup screen")).toBeOnTheScreen();
  });

  it.each(["/home", "/profile", "/settings"])(
    "keeps a user without an account away from %s",
    async (url) => {
      jest.mocked(getMyAccount).mockResolvedValue(null);
      await renderApp(url);
      await act(async () => reportUser(verified));

      expect(await screen.findByText("Finish setup screen")).toBeOnTheScreen();
    },
  );

  it("keeps a user who has an account away from Finish setup", async () => {
    await renderApp("/finish-setup");
    await act(async () => reportUser(verified));

    expect(await screen.findByText("Home screen")).toBeOnTheScreen();
  });

  describe("when the app is reloaded", () => {
    it.each([
      ["/home", "Home screen"],
      ["/profile", "Profile screen"],
      ["/settings", "Settings screen"],
    ])("stays on %s", async (url, expected) => {
      await renderApp(url);
      await act(async () => reportUser(verified));

      expect(await screen.findByText(expected)).toBeOnTheScreen();
    });

    it("waits for a slow account, then stays on the screen", async () => {
      let finishLoading!: (loaded: RallyUser) => void;
      jest
        .mocked(getMyAccount)
        .mockReturnValue(new Promise((resolve) => (finishLoading = resolve)));
      await renderApp("/profile");
      await act(async () => reportUser(verified));

      for (const name of [...allScreens, "Profile screen"])
        expect(screen.queryByText(name)).not.toBeOnTheScreen();

      await act(async () => finishLoading(account));

      expect(await screen.findByText("Profile screen")).toBeOnTheScreen();
    });

    it("explains the problem when the account can't be loaded", async () => {
      jest
        .mocked(getMyAccount)
        .mockRejectedValueOnce(new ApiError(0, "Can't reach the Rally server."));
      await renderApp("/profile");
      await act(async () => reportUser(verified));

      expect(await screen.findByText("We can't load your account")).toBeOnTheScreen();
    });
  });

  it.each([
    ["/profile", "Profile screen"],
    ["/settings", "Settings screen"],
  ] as const)("lets a user with an account open %s", async (url, expected) => {
    await renderApp();
    await act(async () => reportUser(verified));
    expect(await screen.findByText("Home screen")).toBeOnTheScreen();

    await act(async () => router.push(url));
    expect(await screen.findByText(expected)).toBeOnTheScreen();
  });

  describe("when it can't be loaded", () => {
    beforeEach(() => {
      jest
        .mocked(getMyAccount)
        .mockRejectedValueOnce(new ApiError(0, "Can't reach the Rally server."));
    });

    it("explains the problem", async () => {
      await renderApp();
      await act(async () => reportUser(verified));

      expect(await screen.findByText("We can't load your account")).toBeOnTheScreen();
      expect(screen.getByText("Can't reach the Rally server.")).toBeOnTheScreen();
    });

    it("tries again and continues Home", async () => {
      await renderApp();
      await act(async () => reportUser(verified));
      await userEvent.press(await screen.findByRole("button", { name: "Try again" }));

      expect(await screen.findByText("Home screen")).toBeOnTheScreen();
      expect(getMyAccount).toHaveBeenCalledTimes(2);
    });

    it("lets the user log out", async () => {
      await renderApp();
      await act(async () => reportUser(verified));
      await userEvent.press(await screen.findByText("Log out"));

      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });
});
