// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { Database } from "../../db.ts";
import type { PrivacyUpdate } from "./privacy.ts";

export const createProfileRepository = (db: Database) => ({
  findOwner: (firebaseUid: string) => db.user.findUnique({
    where: { firebaseUid },
    select: { id: true, profilePrivacy: true },
  }),
  savePrivacy: (userId: string, settings: PrivacyUpdate) =>
    db.profilePrivacy.upsert({
      where: { userId },
      create: { userId, ...settings },
      update: settings,
    }),
});
export type ProfileRepository = ReturnType<typeof createProfileRepository>;
