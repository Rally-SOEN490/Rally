// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "firebase/auth";
import { request } from "./api";

export type ProfilePrivacy = {
  profileVisible: boolean;
  showPhoto: boolean;
  showBio: boolean;
  showStatus: boolean;
  showInterests: boolean;
  showSocialLinks: boolean;
  showBadges: boolean;
  showMemberSince: boolean;
};
export const getProfilePrivacy = (user: User): Promise<ProfilePrivacy> =>
  request(user, "GET", "/profiles/me/privacy");
export const saveProfilePrivacy = (
  user: User,
  settings: ProfilePrivacy,
): Promise<ProfilePrivacy> =>
  request(user, "PATCH", "/profiles/me/privacy", settings);

export type PlayerProfile = {
  id: string;
  displayName: string;
  photoUrl?: string | null;
  bio?: string | null;
  statusMessage?: string | null;
  interests?: string[];
  socialLinks?: { facebook: string | null; instagram: string | null };
  memberSince?: string;
  badges?: import("./api").RallyUser["badges"];
};
export const getPlayerProfile = (
  user: User,
  id: string,
): Promise<PlayerProfile> =>
  request(user, "GET", `/profiles/${encodeURIComponent(id)}`);
