// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "firebase/auth";
import { Platform } from "react-native";

// Where the Rally API runs. On an Android emulator or a phone, set
// EXPO_PUBLIC_API_URL in .env.local instead (see the README).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type RallyUser = {
  id: string;
  displayName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
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

// The longest name the API accepts.
export const NAME_MAX_LENGTH = 100;
export const BIO_MAX_LENGTH = 300;

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

export const updateMyProfile = (
  user: User,
  displayName: string,
  bio: string,
): Promise<RallyUser> => request(user, "PATCH", "/users/me", { displayName, bio });

export const uploadMyProfilePhoto = async (
  user: User,
  photo: { uri: string; mimeType?: string | null },
): Promise<RallyUser> => {
  const token = await user.getIdToken();
  const form = new FormData();
  if (Platform.OS === "web") {
    const imageResponse = await fetch(photo.uri).catch(() => {
      throw new ApiError(0, "Couldn't read the selected photo. Please choose it again.");
    });
    if (!imageResponse.ok)
      throw new ApiError(0, "Couldn't read the selected photo. Please choose it again.");
    form.append("photo", await imageResponse.blob(), "profile-photo");
  } else {
    form.append("photo", {
      uri: photo.uri,
      name: "profile-photo",
      type: photo.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }
  const response = await fetch(`${API_URL}/users/me/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }).catch(() => {
    throw new ApiError(0, "Can't reach the Rally server. Check your internet connection and try again.");
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, data.message ?? "Something went wrong. Please try again.");
  return data;
};

// Deletes the person's Rally data. Safe to call again if it was already deleted.
export const deleteMyAccount = async (user: User): Promise<void> => {
  await request(user, "DELETE", "/users/me");
};
