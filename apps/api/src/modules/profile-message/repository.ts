// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { Database } from "../../db.ts";

export const createMessageRepository = (db: Database) => ({
  findOwner: (firebaseUid: string) => db.user.findUnique({
    where: { firebaseUid },
    select: { id: true, profileMessage: { select: { text: true } } },
  }),
  save: (userId: string, text: string) => db.profileMessage.upsert({
    where: { userId }, create: { userId, text }, update: { text },
    select: { text: true },
  }),
});
export type MessageRepository = ReturnType<typeof createMessageRepository>;
