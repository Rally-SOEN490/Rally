// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
let ownerId: string;
beforeEach(async () => {
  await testDb.user.deleteMany();
  const owner = await testDb.user.create({
    data: {
      firebaseUid: "owner",
      displayName: "Sam Lee",
      ageConfirmedAt: new Date(),
    },
  });
  ownerId = owner.id;
  await testDb.user.create({
    data: {
      firebaseUid: "viewer",
      displayName: "Alex",
      ageConfirmedAt: new Date(),
    },
  });
  await testDb.playerProfile.create({
    data: {
      userId: ownerId,
      bio: "Volleyball every weekend",
      statusMessage: "Looking for a Sunday game",
      photoUrl: "https://images.example/avatar.png",
      interests: ["Indoor 6s", "Beach 2s"],
      facebookUrl: "https://www.facebook.com/sam",
      instagramUrl: "https://instagram.com/sam",
    },
  });
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});
const read = (id = ownerId, uid = "viewer") =>
  app.inject({
    method: "GET",
    url: `/profiles/${id}`,
    headers: authHeader(uid),
  });
const share = (settings: Record<string, boolean> = {}) =>
  app.inject({
    method: "PATCH",
    url: "/profiles/me/privacy",
    headers: authHeader("owner"),
    payload: { profileVisible: true, ...settings },
  });

describe("viewing another player's profile", () => {
  test("does not reveal that an unshared profile exists", async () => {
    const missing = await read("00000000-0000-0000-0000-000000000000");
    const privateProfile = await read();
    expect(privateProfile.statusCode).toBe(404);
    expect(privateProfile.json()).toEqual(missing.json());
    expect(await testDb.profilePrivacy.count()).toBe(0);
  });
  test("requires login and an existing Rally account", async () => {
    await share();
    expect(
      (await app.inject({ method: "GET", url: `/profiles/${ownerId}` }))
        .statusCode,
    ).toBe(401);
    expect((await read(ownerId, "no-account")).statusCode).toBe(403);
  });
  test("only returns ID and display name when no sections are shared", async () => {
    await share();
    const response = await read();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ id: ownerId, displayName: "Sam Lee" });
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.headers.vary).toContain("Authorization");
  });
  test.each([
    ["showPhoto", "photoUrl"],
    ["showBio", "bio"],
    ["showStatus", "statusMessage"],
    ["showInterests", "interests"],
    ["showSocialLinks", "socialLinks"],
    ["showBadges", "badges"],
    ["showMemberSince", "memberSince"],
  ])("shares only the section enabled by %s", async (flag, field) => {
    await share({ [flag]: true });
    const response = await read();
    expect(Object.keys(response.json()).sort()).toEqual(
      ["id", "displayName", field].sort(),
    );
    await share({ [flag]: false });
    expect((await read()).json()).not.toHaveProperty(field);
  });
  test("never sends account identifiers, consent, privacy flags or internal row fields", async () => {
    await share({
      showPhoto: true,
      showBio: true,
      showStatus: true,
      showInterests: true,
      showSocialLinks: true,
      showBadges: true,
      showMemberSince: true,
    });
    expect((await read()).json()).toEqual({
      id: ownerId,
      displayName: "Sam Lee",
      photoUrl: "https://images.example/avatar.png",
      bio: "Volleyball every weekend",
      statusMessage: "Looking for a Sunday game",
      interests: ["Indoor 6s", "Beach 2s"],
      socialLinks: {
        facebook: "https://www.facebook.com/sam",
        instagram: "https://instagram.com/sam",
      },
      badges: [],
      memberSince: expect.any(String),
    });
  });
  test("owner preview applies the same privacy filters", async () => {
    await share({ showStatus: true });
    expect((await read(ownerId, "owner")).json()).toEqual(
      (await read()).json(),
    );
  });
  test("hiding the profile takes effect on the next request", async () => {
    await share({ showBio: true });
    expect((await read()).statusCode).toBe(200);
    await app.inject({
      method: "PATCH",
      url: "/profiles/me/privacy",
      headers: authHeader("owner"),
      payload: { profileVisible: false },
    });
    expect((await read()).statusCode).toBe(404);
  });
  test("viewing does not grant badges or create profile data", async () => {
    await share({ showBadges: true });
    await testDb.playerProfile.deleteMany();
    await read();
    await read();
    expect(await testDb.userBadge.count()).toBe(0);
    expect(await testDb.playerProfile.count()).toBe(0);
    expect(await testDb.profilePrivacy.count()).toBe(1);
  });
  test("returns empty optional sections for an account without details", async () => {
    await testDb.playerProfile.deleteMany();
    await share({
      showPhoto: true,
      showBio: true,
      showStatus: true,
      showInterests: true,
      showSocialLinks: true,
    });
    expect((await read()).json()).toMatchObject({
      photoUrl: null,
      bio: null,
      statusMessage: null,
      interests: [],
      socialLinks: { facebook: null, instagram: null },
    });
  });
  test.each([
    "javascript:alert(1)",
    "https://facebook.com.evil.example/sam",
    "https://user:secret@facebook.com/sam",
    "http://facebook.com/sam",
  ])("filters unsafe or incorrect social URL %s", async (facebookUrl) => {
    await testDb.playerProfile.update({
      where: { userId: ownerId },
      data: { facebookUrl },
    });
    await share({ showSocialLinks: true });
    expect((await read()).json().socialLinks.facebook).toBeNull();
  });
  test("rejects unsafe photo URLs without affecting the rest of the profile", async () => {
    await testDb.playerProfile.update({
      where: { userId: ownerId },
      data: { photoUrl: "data:text/html,unsafe" },
    });
    await share({ showPhoto: true });
    expect((await read()).json().photoUrl).toBeNull();
  });
  test("rejects malformed profile IDs", async () => {
    expect((await read("bad-id")).statusCode).toBe(400);
  });
  test("uses the existing badge tier logic and stable descending ordering", async () => {
    const badge = await testDb.badgeType.findUniqueOrThrow({
      where: { key: "champion" },
    });
    await testDb.userBadge.create({
      data: { userId: ownerId, badgeTypeId: badge.id, receivedCount: 21 },
    });
    await share({ showBadges: true });
    expect((await read()).json().badges).toEqual([
      expect.objectContaining({
        key: "champion",
        tier: "Gold",
        receivedCount: 21,
        image: "badge-gold-placeholder",
      }),
    ]);
  });
});
