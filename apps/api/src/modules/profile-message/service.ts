// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { MessageRepository } from "./repository.ts";

export const createMessageService = (messages: MessageRepository) => {
  const owner = async (uid: string) => {
    const user = await messages.findOwner(uid);
    if (!user) throw Object.assign(new Error("No Rally account found."), { statusCode: 404 });
    return user;
  };
  return {
    get: async (uid: string) => ({ message: (await owner(uid)).profileMessage?.text ?? "" }),
    save: async (uid: string, text: string) => {
      const user = await owner(uid);
      const saved = await messages.save(user.id, text.trim());
      return { message: saved.text };
    },
  };
};
