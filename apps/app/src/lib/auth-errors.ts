// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

const messages: Record<string, string> = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "Wrong email or password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-email": "Please enter your email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/email-already-in-use":
    "An account with this email already exists. Try logging in instead.",
  "auth/weak-password": "Your password must be at least 6 characters long.",
  "auth/password-does-not-meet-requirements":
    "Your password doesn't meet the password requirements.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed":
    "Can't reach the server. Check your internet connection and try again.",
};

export const authErrorMessage = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  return (code && messages[code]) || "Something went wrong. Please try again.";
};
