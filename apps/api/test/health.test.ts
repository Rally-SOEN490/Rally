// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, expect, test } from "vitest";
import { buildApp } from "../src/app.ts";
import type { Database } from "../src/db.ts";
import { buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

test("reports ok when the database is reachable", async () => {
  const response = await app.inject({ method: "GET", url: "/health" });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ status: "ok" });
});

test("reports a problem when the database can't be reached", async () => {
  const brokenDb = {
    $queryRaw: () => Promise.reject(new Error("Can't reach database server")),
  } as unknown as Database;
  const brokenApp = await buildApp({
    db: brokenDb,
    verifyIdToken: async () => ({ uid: "alice" }),
    corsOrigins: [],
  });

  const response = await brokenApp.inject({ method: "GET", url: "/health" });

  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual({ status: "database unavailable" });
  await brokenApp.close();
});
