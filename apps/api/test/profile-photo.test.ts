// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { buildApp } from "../src/app.ts";
import type { ProfilePhotoStorage } from "../src/modules/users/photo-storage.ts";
import { authHeader, testDb } from "./helpers.ts";

const photos: ProfilePhotoStorage = {
  put: vi.fn().mockResolvedValue("profile-photos/alice/new.png"),
  getUrl: vi.fn().mockResolvedValue("https://signed.example/new.png"),
  delete: vi.fn().mockResolvedValue({}),
};

const app = await buildApp({
  db: testDb,
  verifyIdToken: async (token) => {
    if (!token.startsWith("token-")) throw new Error("Invalid token");
    return { uid: token.slice("token-".length) };
  },
  corsOrigins: [],
  photos,
});

const register = (uid = "alice") =>
  app.inject({
    method: "POST",
    url: "/users/me",
    headers: authHeader(uid),
    payload: { displayName: "Alice", ageConfirmed: true },
  });

const upload = (uid = "alice", contents = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex")) => {
  const boundary = "rally-photo-boundary";
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\n`),
    contents,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return app.inject({
    method: "POST",
    url: "/users/me/photo",
    headers: {
      ...authHeader(uid),
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload: body,
  });
};

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(photos.put).mockResolvedValue("profile-photos/alice/new.png");
  vi.mocked(photos.getUrl).mockResolvedValue("https://signed.example/new.png");
  vi.mocked(photos.delete).mockResolvedValue({ $metadata: {} });
  await testDb.user.deleteMany();
});

afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

test("uploads the photo, persists its key, and returns a signed URL", async () => {
  await register();

  const response = await upload();

  expect(response.statusCode).toBe(200);
  expect(response.json().profilePhotoUrl).toBe("https://signed.example/new.png");
  expect(photos.put).toHaveBeenCalledWith("alice", expect.any(Buffer));
  expect(await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } }))
    .toMatchObject({ profilePhotoKey: "profile-photos/alice/new.png" });
});

test("deletes the old photo after replacing it", async () => {
  await register();
  await testDb.user.update({
    where: { firebaseUid: "alice" },
    data: { profilePhotoKey: "profile-photos/alice/old.png" },
  });

  const response = await upload();

  expect(response.statusCode).toBe(200);
  expect(photos.delete).toHaveBeenCalledWith("profile-photos/alice/old.png");
});

test("removes the current photo from the account and storage", async () => {
  await register();
  await testDb.user.update({
    where: { firebaseUid: "alice" },
    data: { profilePhotoKey: "profile-photos/alice/old.png" },
  });

  const response = await app.inject({
    method: "DELETE",
    url: "/users/me/photo",
    headers: authHeader("alice"),
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().profilePhotoUrl).toBeNull();
  expect(photos.delete).toHaveBeenCalledWith("profile-photos/alice/old.png");
  expect(await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } }))
    .toMatchObject({ profilePhotoKey: null });
});

test("returns not found when removing a photo for a missing Rally account", async () => {
  const response = await app.inject({
    method: "DELETE",
    url: "/users/me/photo",
    headers: authHeader("alice"),
  });

  expect(response.statusCode).toBe(404);
});

test("keeps the stored photo when storage deletion fails", async () => {
  await register();
  await testDb.user.update({
    where: { firebaseUid: "alice" },
    data: { profilePhotoKey: "profile-photos/alice/old.png" },
  });
  vi.mocked(photos.delete).mockRejectedValueOnce(new Error("Storage unavailable"));

  const response = await app.inject({
    method: "DELETE",
    url: "/users/me/photo",
    headers: authHeader("alice"),
  });

  expect(response.statusCode).toBe(500);
  expect(await testDb.user.findUniqueOrThrow({ where: { firebaseUid: "alice" } }))
    .toMatchObject({ profilePhotoKey: "profile-photos/alice/old.png" });
});

test("rejects requests without a file", async () => {
  await register();
  const response = await app.inject({
    method: "POST",
    url: "/users/me/photo",
    headers: { ...authHeader("alice"), "content-type": "multipart/form-data; boundary=empty" },
    payload: "--empty--\r\n",
  });

  expect(response.statusCode).toBe(400);
  expect(response.json().message).toBe("Choose a profile photo to upload.");
});

test("rejects invalid image data", async () => {
  await register();

  const response = await upload("alice", Buffer.from("not an image"));

  expect(response.statusCode).toBe(400);
  expect(response.json().message).toBe("Use a JPEG, PNG, or WebP image.");
});

test("rejects files over the configured size limit", async () => {
  await register();
  const response = await upload("alice", Buffer.alloc(5 * 1024 * 1024 + 1, 0));

  expect(response.statusCode).toBe(413);
  expect(photos.put).not.toHaveBeenCalled();
});

test("rejects photo uploads without authentication", async () => {
  const response = await app.inject({ method: "POST", url: "/users/me/photo" });

  expect(response.statusCode).toBe(401);
});

test("returns not found when the authenticated person has no Rally account", async () => {
  const response = await upload();

  expect(response.statusCode).toBe(404);
  expect(photos.put).not.toHaveBeenCalled();
});