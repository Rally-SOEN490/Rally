/*
AI declaration:
50% or more AI-generated
*/


import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
const requestCount = 25;
const p95LimitMs = Number(process.env.ACCOUNT_READ_P95_MS ?? 2000);

beforeEach(async () => {
  await testDb.user.deleteMany();
  const response = await app.inject({
    method: "POST",
    url: "/users/me",
    headers: authHeader("performance-user"),
    payload: { displayName: "Performance User", ageConfirmed: true },
  });
  expect(response.statusCode).toBe(200);
});

afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

describe("authenticated account read performance", () => {
  test(`serves ${requestCount} concurrent account reads within the p95 budget`, async () => {
    const durations: number[] = [];
    const responses = await Promise.all(
      Array.from({ length: requestCount }, async () => {
        const startedAt = performance.now();
        const response = await app.inject({
          method: "GET",
          url: "/users/me",
          headers: authHeader("performance-user"),
        });
        durations.push(performance.now() - startedAt);
        return response;
      }),
    );
    durations.sort((left, right) => left - right);
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1] ?? 0;

    expect(responses.every((response) => response.statusCode === 200)).toBe(true);
    expect(responses.every((response) => response.json().displayName === "Performance User")).toBe(true);
    expect(p95).toBeLessThan(p95LimitMs);
  });
});
