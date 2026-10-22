// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "firebase/auth";

// Where the Rally API runs. On an Android emulator or a phone, set
// EXPO_PUBLIC_API_URL in .env.local instead (see the README).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type RallyUser = {
  id: string;
  displayName: string;
  createdAt: string;
  badges: {
    key: string;
    name: string;
    tier: string;
    description: string;
    imageUrl: string | null;
    image: string;
    receivedCount: number;
    awardedAt: string;
  }[];
};

export type Gender = "male" | "female";

// The longest name the API accepts.
export const NAME_MAX_LENGTH = 100;

// The API refused the request or couldn't be reached. `message` can be shown to the user.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// A message to show the user for any error from the API.
export const apiErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Something went wrong. Please try again.";

// Calls the API as `user`. Firebase gives us a token that proves who they are.
const request = async (
  user: User,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: object,
) => {
  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  }).catch(() => {
    throw new ApiError(0, "Can't reach the Rally server. Check your internet connection and try again.");
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, data.message ?? "Something went wrong. Please try again.");
  return data;
};

// Saves a new account in Rally's database. Only call it after they confirmed their age.
export const saveNewUser = (user: User, displayName: string): Promise<RallyUser> =>
  request(user, "POST", "/users/me", { displayName, ageConfirmed: true });

// Returns null if the person has a Firebase login but no Rally account.
export const getMyAccount = (user: User): Promise<RallyUser | null> =>
  request(user, "GET", "/users/me").catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });

// Deletes the person's Rally data. Safe to call again if it was already deleted.
export const deleteMyAccount = async (user: User): Promise<void> => {
  await request(user, "DELETE", "/users/me");
};

export const getMyGender = (user: User): Promise<{ gender: Gender | null }> =>
  request(user, "GET", "/users/me/gender");

export const saveMyGender = (
  user: User,
  gender: Gender | null,
): Promise<{ gender: Gender | null }> => request(user, "PATCH", "/users/me/gender", { gender });
