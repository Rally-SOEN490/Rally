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
export const saveProfilePrivacy = (user: User, settings: ProfilePrivacy): Promise<ProfilePrivacy> =>
  request(user, "PATCH", "/profiles/me/privacy", settings);
