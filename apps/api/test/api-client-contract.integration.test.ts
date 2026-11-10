// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { authHeader, buildTestApp, testDb } from "./helpers.ts";

const app = await buildTestApp();
const baseUrl = await app.listen({ host: "127.0.0.1", port: 0 });

beforeEach(async () => {
  await testDb.user.deleteMany();
});

afterAll(async () => {
  await app.close();
  await testDb.$disconnect();
});

const clientRequest = async (
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  token: string,
  body?: object,
) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...authHeader(token),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.json(),
  };
};

describe("app API client contract integration", () => {
  test("supports the app account lifecycle over authenticated HTTP", async () => {
    const created = await clientRequest("POST", "/users/me", "alice", {
      displayName: " Alice ",
      ageConfirmed: true,
    });
    const read = await clientRequest("GET", "/users/me", "alice");
    const updated = await clientRequest("PATCH", "/users/me", "alice", {
      lookingForTeam: true,
    });

    expect(created).toMatchObject({
      ok: true,
      status: 200,
      body: { displayName: "Alice", lookingForTeam: false },
    });
    expect(read).toMatchObject({ ok: true, body: { displayName: "Alice" } });
    expect(updated).toMatchObject({
      ok: true,
      body: { displayName: "Alice", lookingForTeam: true },
    });
    expect(await testDb.user.count()).toBe(1);
  });

  test("returns the server's authentication failure shape", async () => {
    const response = await fetch(`${baseUrl}/users/me`);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Log in to continue." });
  });
});
