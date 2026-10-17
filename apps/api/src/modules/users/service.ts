// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "../../generated/prisma/client.ts";
import type { UserRepository } from "./repository.ts";

// What the API sends back about a user. Internal fields like firebaseUid stay on the server.
export type UserResponse = { id: string; displayName: string; createdAt: string };

const toResponse = (user: User): UserResponse => ({
  id: user.id,
  displayName: user.displayName,
  createdAt: user.createdAt.toISOString(),
});

export const createUserService = (users: UserRepository) => ({
  // The route only accepts the request if the person confirmed their age.
  register: async (firebaseUid: string, displayName: string) =>
    toResponse(
      await users.createIfMissing({
        firebaseUid,
        displayName: displayName.trim(),
        ageConfirmedAt: new Date(),
      }),
    ),

  getCurrent: async (firebaseUid: string) => {
    const user = await users.findByFirebaseUid(firebaseUid);
    return user ? toResponse(user) : null;
  },
});
