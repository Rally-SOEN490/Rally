// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "firebase/auth";
import { request } from "./api";

export type ProfileMessage = { message: string };
export const getProfileMessage = (user: User): Promise<ProfileMessage> =>
  request(user, "GET", "/profiles/me/message");
export const saveProfileMessage = (user: User, message: string): Promise<ProfileMessage> =>
  request(user, "PATCH", "/profiles/me/message", { message });
