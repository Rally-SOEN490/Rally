// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

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
  });
});

test("uses port 3000 and the Expo dev server when those aren't set", () => {
  const config = loadConfig(requiredSettings);

  expect(config.port).toBe(3000);
  expect(config.corsOrigins).toEqual(["http://localhost:8081"]);
});

test.each(["DATABASE_URL", "FIREBASE_PROJECT_ID"])(
  "explains how to fix a missing %s",
  (name) => {
    expect(() => loadConfig({ ...requiredSettings, [name]: "" })).toThrow(
      `${name} is missing. Copy .env.example to .env and fill it in.`,
    );
  },
);
