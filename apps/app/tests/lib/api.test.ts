// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "firebase/auth";
import { ApiError, getMyAccount, saveNewUser } from "@/lib/api";

const user = { getIdToken: jest.fn().mockResolvedValue("the-token") } as unknown as User;
const account = { id: "1", displayName: "Sam Lee", createdAt: "2026-10-17T12:00:00.000Z" };

// Pretends the API answered with this status and JSON body.
const respond = (status: number, body?: object) =>
  jest.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body ? Promise.resolve(body) : Promise.reject(new SyntaxError("No JSON"))),
  } as Response);

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

describe("saveNewUser", () => {
  it("sends the name and age confirmation with the user's token", async () => {
    respond(200, account);

    await expect(saveNewUser(user, "Sam Lee")).resolves.toEqual(account);
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users/me", {
      method: "POST",
      headers: { Authorization: "Bearer the-token", "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Sam Lee", ageConfirmed: true }),
    });
  });
});

describe("getMyAccount", () => {
  it("returns the account, sending only the token", async () => {
    respond(200, account);

    await expect(getMyAccount(user)).resolves.toEqual(account);
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users/me", {
      method: "GET",
      headers: { Authorization: "Bearer the-token" },
      body: undefined,
    });
  });

  it("returns null when the API has no account for this login", async () => {
    respond(404, { message: "No Rally account found." });

    await expect(getMyAccount(user)).resolves.toBeNull();
  });

  it("passes on the API's message for other errors", async () => {
    respond(401, { message: "Log in to continue." });

    await expect(getMyAccount(user)).rejects.toEqual(new ApiError(401, "Log in to continue."));
  });

  it("uses a general message when the error has no message", async () => {
    respond(500);

    const error = await getMyAccount(user).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, message: "Something went wrong. Please try again." });
  });

  it("explains when the API can't be reached", async () => {
    jest.mocked(fetch).mockRejectedValue(new TypeError("Network request failed"));

    await expect(getMyAccount(user)).rejects.toMatchObject({
      status: 0,
      message: "Can't reach the Rally server. Check your internet connection and try again.",
    });
  });
});

it("calls the address in EXPO_PUBLIC_API_URL when it is set", async () => {
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3000";
  respond(200, account);
  try {
    // Load a fresh copy, because the address is read when the file is first imported.
    let request: Promise<unknown> = Promise.resolve();
    jest.isolateModules(() => {
      request = require("@/lib/api").getMyAccount(user);
    });
    await request;
    expect(fetch).toHaveBeenCalledWith("http://10.0.2.2:3000/users/me", expect.anything());
  } finally {
    delete process.env.EXPO_PUBLIC_API_URL;
  }
});
