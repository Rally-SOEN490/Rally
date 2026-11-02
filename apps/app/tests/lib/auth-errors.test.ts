// Copyright (c) 2026 Rally. All rights reserved.

import { authErrorMessage } from "@/lib/auth-errors";

describe("authErrorMessage", () => {
  it.each([
    ["auth/invalid-credential", "Wrong email or password."],
    ["auth/wrong-password", "Wrong email or password."],
    ["auth/user-not-found", "Wrong email or password."],
    ["auth/invalid-email", "That email address doesn't look right."],
    [
      "auth/email-already-in-use",
      "An account with this email already exists. Try logging in instead.",
    ],
    ["auth/too-many-requests", "Too many attempts. Please wait a few minutes and try again."],
  ])("turns %s into a friendly sentence", (code, message) => {
    expect(authErrorMessage({ code })).toBe(message);
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(authErrorMessage({ code: "auth/something-new" })).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it.each([null, undefined, new Error("boom"), "boom"])(
    "falls back to a generic message when there is no code (%p)",
    (error) => {
      expect(authErrorMessage(error)).toBe("Something went wrong. Please try again.");
    },
  );
});
