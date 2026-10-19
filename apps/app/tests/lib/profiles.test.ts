// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "firebase/auth";
import {
  getProfilePrivacy,
  saveProfilePrivacy,
  getPlayerProfile,
} from "@/lib/profiles";
const user = {
  getIdToken: jest.fn().mockResolvedValue("owner-token"),
} as unknown as User;
beforeEach(() => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ profileVisible: true }),
    });
});
it("fetches privacy as the signed-in owner", async () => {
  await getProfilePrivacy(user);
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:3000/profiles/me/privacy",
    expect.objectContaining({
      method: "GET",
      headers: { Authorization: "Bearer owner-token" },
    }),
  );
});
it("saves privacy using PATCH and the owner's token", async () => {
  const settings = {
    profileVisible: true,
    showPhoto: false,
    showBio: false,
    showStatus: false,
    showInterests: false,
    showSocialLinks: false,
    showBadges: true,
    showMemberSince: false,
  };
  await saveProfilePrivacy(user, settings);
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:3000/profiles/me/privacy",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify(settings),
      headers: {
        Authorization: "Bearer owner-token",
        "Content-Type": "application/json",
      },
    }),
  );
});

it("encodes profile identifiers in authenticated lookups", async () => {
  await getPlayerProfile(user, "player/id");
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:3000/profiles/player%2Fid",
    expect.objectContaining({
      method: "GET",
      headers: { Authorization: "Bearer owner-token" },
    }),
  );
});
