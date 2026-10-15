// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

jest.mock("firebase/app", () => ({ initializeApp: jest.fn(() => "firebase-app") }));
jest.mock("firebase/auth", () => ({ getAuth: jest.fn(() => "firebase-auth") }));

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
