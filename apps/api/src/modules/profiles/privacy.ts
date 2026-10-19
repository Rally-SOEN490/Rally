// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

// Missing preferences are private. New sections must be explicitly added here
// and to the public response projection before they can be exposed.
export const defaultPrivacy = {
  profileVisible: false,
  showPhoto: false,
  showBio: false,
  showStatus: false,
  showInterests: false,
  showSocialLinks: false,
  showBadges: false,
  showMemberSince: false,
};
export type ProfilePrivacy = typeof defaultPrivacy;
export type PrivacyUpdate = Partial<ProfilePrivacy>;
export const privacyKeys = Object.keys(defaultPrivacy) as (keyof ProfilePrivacy)[];
export const privacyProperties = Object.fromEntries(
  privacyKeys.map((key) => [key, { type: "boolean" }]),
);
