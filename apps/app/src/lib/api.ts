// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import { Platform } from "react-native";
import type { SavedInterests, SkillLevel } from "@/lib/player-preferences";

// Where the Rally API runs. On an Android emulator or a phone, set
// EXPO_PUBLIC_API_URL in .env.local instead (see the README).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type Language = "EN" | "FR";
export type ColorTheme = "green" | "blue" | "pink";
// Use it to show or hide organizer tools. The API checks the role again on
// every restricted request, so hiding a button is not the security check.
export type AccountRole = "PLAYER" | "ORGANIZER" | "ADMIN";

export type RallyUser = {
  id: string;
  displayName: string;
  skillLevel?: SkillLevel | null;
  // The API always sends it; treat a missing role as "PLAYER", the safe default.
  role?: AccountRole;
  profilePhotoUrl: string | null;
  lookingForTeam: boolean;
  shownBadgeKeys?: string[];
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  thoughtText?: string | null;
  interests?: SavedInterests;
  // App settings from the Settings screen.
  notificationsEnabled?: boolean;
  language?: Language;
  colorTheme?: ColorTheme;
  colorBlindMode?: boolean;
  darkMode?: boolean;
  createdAt: string;
  badges: {
    key: string;
    name: string;
    tier: string;
    description: string;
    imageUrl: string | null;
    image: string;
    availableTiers?: string[];
    isComplete?: boolean;
    nextTierThreshold?: number | null;
    receivedCount: number;
    awardedAt: string;
  }[];
};

export type RallyPlayer = Pick<
  RallyUser,
  "id" | "displayName" | "skillLevel" | "interests" | "lookingForTeam" | "createdAt" | "badges"
>;

export type ProfileChanges =
  | { displayName: string }
  | { skillLevel: SkillLevel | null }
  | { lookingForTeam: boolean }
  | { shownBadgeKeys: string[] }
  | { instagramUrl: string | null }
  | { facebookUrl: string | null }
  | { thoughtText: string | null }
  | { interests: SavedInterests }
  | { notificationsEnabled: boolean }
  | { language: Language }
  | { colorTheme: ColorTheme }
  | { colorBlindMode: boolean }
  | { darkMode: boolean };

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
// Pass null only for the few routes that work without logging in.
export const request = async (
  user: User | null,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: object,
) => {
  const token = user && (await user.getIdToken());
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  }).catch(() => {
    throw new ApiError(
      0,
      "Can't reach the Rally server. Check your internet connection and try again.",
    );
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

export const updateMyDisplayName = (user: User, displayName: string): Promise<RallyUser> =>
  request(user, "PATCH", "/users/me", { displayName });

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
    throw new ApiError(
      0,
      "Can't reach the Rally server. Check your internet connection and try again.",
    );
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, data.message ?? "Something went wrong. Please try again.");
  return data;
};

export const removeMyProfilePhoto = (user: User): Promise<RallyUser> =>
  request(user, "DELETE", "/users/me/photo");

export const getPlayers = (user: User): Promise<RallyPlayer[]> => request(user, "GET", "/users");

export const updateMyAccount = (user: User, changes: ProfileChanges): Promise<RallyUser> =>
  request(user, "PATCH", "/users/me", changes);

// Deletes the person's Rally data. Safe to call again if it was already deleted.
export const deleteMyAccount = async (user: User): Promise<void> => {
  await request(user, "DELETE", "/users/me");
};
