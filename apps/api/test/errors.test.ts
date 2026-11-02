// Copyright (c) 2026 Rally. All rights reserved.

import { afterAll, expect, test } from "vitest";
import { buildApp } from "../src/app.ts";
import type { Database } from "../src/db.ts";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

test("hides internal details when something breaks on the server", async () => {
  const brokenDb = {
    user: {
      findUnique: () =>
        Promise.reject(
          new Error("Invalid `prisma.user.findUnique()`: database `rally` does not exist"),
        ),
    },
  } as unknown as Database;
  const brokenApp = await buildApp({
    db: brokenDb,
    verifyIdToken: async () => ({ uid: "alice" }),
    corsOrigins: [],
  });

  const response = await brokenApp.inject({
    method: "GET",
    url: "/users/me",
    headers: authHeader("alice"),
  });

  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({
    message: "Something went wrong on our side. Please try again.",
  });
  await brokenApp.close();
});

test("explains other request problems", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/users/me",
    headers: { ...authHeader("alice"), "content-type": "application/json" },
    payload: "{not json",
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    message: "Body is not valid JSON but content-type is set to 'application/json'",
  });
});
