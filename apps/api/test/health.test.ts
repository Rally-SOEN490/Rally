// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, expect, test } from "vitest";
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
