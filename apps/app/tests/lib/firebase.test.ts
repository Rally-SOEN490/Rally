// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => "firebase-app"),
}));
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => "firebase-auth"),
  connectAuthEmulator: jest.fn(),
}));

it("connects to Firebase and exports its auth service", () => {
  // Load the file inside the test, because Firebase is set up when it's first imported.
  const { auth } = require("@/lib/firebase");

  expect(initializeApp).toHaveBeenCalledWith(
    expect.objectContaining({
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    }),
  );
  expect(getAuth).toHaveBeenCalledWith("firebase-app");
  expect(auth).toBe("firebase-auth");
});

it("only connects to a local emulator when explicitly requested", () => {
  process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL = "http://127.0.0.1:9099";
  try {
    jest.isolateModules(() => {
      require("@/lib/firebase");
    });
    expect(connectAuthEmulator).toHaveBeenCalledWith(
      "firebase-auth",
      "http://127.0.0.1:9099",
      { disableWarnings: true },
    );
  } finally {
    delete process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  }
});
it.each(["https://auth.example", "http://auth.example"])(
  "rejects a remote emulator address %s",
  (url) => {
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL = url;
    try {
      expect(() =>
        jest.isolateModules(() => {
          require("@/lib/firebase");
        }),
      ).toThrow("Use a local Firebase Auth emulator address.");
    } finally {
      delete process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
    }
  },
);
