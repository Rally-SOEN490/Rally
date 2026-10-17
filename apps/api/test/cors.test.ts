// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { afterAll, expect, test } from "vitest";
import { buildApp } from "../src/app.ts";
import { testDb } from "./helpers.ts";

const app = await buildApp({
  db: testDb,
  verifyIdToken: async () => ({ uid: "alice" }),
  corsOrigins: ["http://localhost:8081"],
});
afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

// Before a DELETE, or any request with a token, the browser first asks the API
// whether this website may send it. This is that question.
const askPermission = (origin: string, method: string) =>
  app.inject({
    method: "OPTIONS",
    url: "/users/me",
    headers: {
      origin,
      "access-control-request-method": method,
      "access-control-request-headers": "authorization,content-type",
    },
  });

test.each(["GET", "POST", "DELETE"])("lets the app send %s requests", async (method) => {
  const response = await askPermission("http://localhost:8081", method);

  expect(response.statusCode).toBe(204);
  expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:8081");
  expect(response.headers["access-control-allow-methods"]).toContain(method);
});

test("doesn't let other websites call the API", async () => {
  const response = await askPermission("https://evil.example", "DELETE");

  expect(response.headers["access-control-allow-origin"]).toBeUndefined();
});
