// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { ProfileRepository } from "./repository.ts";
import { defaultPrivacy, privacyKeys, type ProfilePrivacy, type PrivacyUpdate } from "./privacy.ts";

export const privacyResponse = (stored: ProfilePrivacy | null): ProfilePrivacy =>
  Object.fromEntries(privacyKeys.map((key) => [key, stored?.[key] ?? defaultPrivacy[key]])) as ProfilePrivacy;

export const createProfileService = (profiles: ProfileRepository) => ({
  getPrivacy: async (firebaseUid: string) => {
    const owner = await profiles.findOwner(firebaseUid);
    return owner ? privacyResponse(owner.profilePrivacy) : null;
  },
  savePrivacy: async (firebaseUid: string, settings: PrivacyUpdate) => {
    const owner = await profiles.findOwner(firebaseUid);
    if (!owner) return null;
    return privacyResponse(await profiles.savePrivacy(owner.id, settings));
  },
});
