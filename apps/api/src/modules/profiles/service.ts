// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { publicProfile } from "./projection.ts";
import type { ProfileRepository } from "./repository.ts";
import { privacyResponse, type PrivacyUpdate } from "./privacy.ts";

export const createProfileService = (profiles: ProfileRepository) => ({
  getPublic: async (firebaseUid: string, id: string) => {
    if (!(await profiles.findOwner(firebaseUid)))
      return { kind: "unregistered" } as const;
    const player = await profiles.findPlayer(id);
    if (!player || !player.profilePrivacy?.profileVisible)
      return { kind: "unavailable" } as const;
    return { kind: "profile", profile: publicProfile(player) } as const;
  },
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
