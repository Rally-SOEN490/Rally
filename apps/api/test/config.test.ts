// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

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
    email: { resendApiKey: null, from: "Rally <onboarding@resend.dev>" },
    organizerReviewerEmails: [],
    appUrl: "http://localhost:8081",
  });
});

test("reads the email and organizer review settings", () => {
  const config = loadConfig({
    ...requiredSettings,
    RESEND_API_KEY: "re_key",
    EMAIL_FROM: "Rally <noreply@rally.example>",
    ORGANIZER_REVIEWER_EMAILS: " first@rally.example, ,second@rally.example ",
    APP_URL: "https://rally.example/",
  });

  expect(config.email).toEqual({ resendApiKey: "re_key", from: "Rally <noreply@rally.example>" });
  expect(config.organizerReviewerEmails).toEqual(["first@rally.example", "second@rally.example"]);
  expect(config.appUrl).toBe("https://rally.example");
});

test("names an invalid reviewer email", () => {
  expect(() =>
    loadConfig({ ...requiredSettings, ORGANIZER_REVIEWER_EMAILS: "ok@rally.example,not-an-email" }),
  ).toThrow("ORGANIZER_REVIEWER_EMAILS has an invalid email address: not-an-email");
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
