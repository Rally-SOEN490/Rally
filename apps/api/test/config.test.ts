// Copyright (c) 2026 Rally. All rights reserved.

import { expect, test } from "vitest";
import { loadConfig } from "../src/config.ts";

const requiredSettings = {
  DATABASE_URL: "postgresql://rally:rally@localhost:5432/rally",
  FIREBASE_PROJECT_ID: "rally-test",
};

test("reads the settings", () => {
  const config = loadConfig({
    ...requiredSettings,
    PORT: "4000",
    CORS_ORIGINS: "http://localhost:8081,https://rally.example",
  });

  expect(config).toEqual({
    databaseUrl: "postgresql://rally:rally@localhost:5432/rally",
    firebaseProjectId: "rally-test",
    port: 4000,
    corsOrigins: ["http://localhost:8081", "https://rally.example"],
    r2: null,
  });
});

test("uses port 3000 and the Expo dev server when those aren't set", () => {
  const config = loadConfig(requiredSettings);

  expect(config.port).toBe(3000);
  expect(config.corsOrigins).toEqual(["http://localhost:8081"]);
  expect(config.r2).toBeNull();
});

test("reads complete R2 settings", () => {
  const config = loadConfig({
    ...requiredSettings,
    R2_ACCOUNT_ID: "account",
    R2_ACCESS_KEY_ID: "access",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET_NAME: "photos",
  });

  expect(config.r2).toEqual({
    accountId: "account",
    accessKeyId: "access",
    secretAccessKey: "secret",
    bucketName: "photos",
  });
});

test("rejects partially configured R2 settings", () => {
  expect(() => loadConfig({ ...requiredSettings, R2_ACCOUNT_ID: "account" })).toThrow(
    "R2 settings are incomplete. Configure all R2_* values or leave them blank.",
  );
});

test.each(["DATABASE_URL", "FIREBASE_PROJECT_ID"])("explains how to fix a missing %s", (name) => {
  expect(() => loadConfig({ ...requiredSettings, [name]: "" })).toThrow(
    `${name} is missing. Copy .env.example to .env and fill it in.`,
  );
});
