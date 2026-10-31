// Copyright (c) 2026 Rally contributors
// AI contribution: 50% or more AI-generated
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  getSignedUrl: vi.fn(),
  clientOptions: undefined as unknown,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    constructor(options: unknown) {
      mocks.clientOptions = options;
    }
    send = mocks.send;
  },
  DeleteObjectCommand: class {
    readonly input: unknown;
    constructor(input: unknown) { this.input = input; }
  },
  GetObjectCommand: class {
    readonly input: unknown;
    constructor(input: unknown) { this.input = input; }
  },
  PutObjectCommand: class {
    readonly input: unknown;
    constructor(input: unknown) { this.input = input; }
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mocks.getSignedUrl,
}));

import { createProfilePhotoStorage, profilePhotoMaxBytes, profilePhotoTypes } from "../src/modules/users/photo-storage.ts";

const settings = {
  accountId: "account-id",
  accessKeyId: "access-key",
  secretAccessKey: "secret-key",
  bucketName: "profile-photos",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.send.mockResolvedValue({});
  mocks.getSignedUrl.mockResolvedValue("https://signed.example/photo");
});

test("exports accepted file types and the 5 MB maximum", () => {
  expect(profilePhotoTypes).toEqual(["image/jpeg", "image/png", "image/webp"]);
  expect(profilePhotoMaxBytes).toBe(5 * 1024 * 1024);
});

describe("R2 profile photo storage", () => {
  test("configures the S3 client for the Cloudflare account", () => {
    createProfilePhotoStorage(settings);

    expect(mocks.clientOptions).toEqual({
      region: "auto",
      endpoint: "https://account-id.r2.cloudflarestorage.com",
      credentials: { accessKeyId: "access-key", secretAccessKey: "secret-key" },
    });
  });

  test("uploads a detected PNG under the user's key", async () => {
    const storage = createProfilePhotoStorage(settings);
    const body = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");

    const key = await storage.put("alice", body);

    expect(key).toMatch(/^profile-photos\/alice\/[0-9a-f-]+\.png$/);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        Bucket: "profile-photos",
        Key: key,
        Body: body,
        ContentType: "image/png",
      }),
    }));
  });

  test("rejects data that is not a supported image", async () => {
    const storage = createProfilePhotoStorage(settings);

    await expect(storage.put("alice", Buffer.from("not an image"))).rejects.toThrow(
      "Use a JPEG, PNG, or WebP image.",
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test("creates a short-lived signed read URL", async () => {
    const storage = createProfilePhotoStorage(settings);

    await expect(storage.getUrl("profile-photos/alice/photo.png")).resolves.toBe(
      "https://signed.example/photo",
    );
    expect(mocks.getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ input: { Bucket: "profile-photos", Key: "profile-photos/alice/photo.png" } }),
      { expiresIn: 900 },
    );
  });

  test("deletes an object by key", async () => {
    const storage = createProfilePhotoStorage(settings);

    await storage.delete("profile-photos/alice/photo.png");

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ input: { Bucket: "profile-photos", Key: "profile-photos/alice/photo.png" } }),
    );
  });
});
