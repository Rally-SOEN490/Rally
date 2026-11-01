// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import {
  ApiError,
  apiErrorMessage,
  deleteMyAccount,
  getMyAccount,
  getPlayers,
  removeMyProfilePhoto,
  saveNewUser,
  updateMyDisplayName,
  updateMyAccount,
  uploadMyProfilePhoto,
} from "@/lib/api";

jest.mock("react-native", () => ({ Platform: { OS: "web" } }));

const user = { getIdToken: jest.fn().mockResolvedValue("the-token") } as unknown as User;
const account = {
  id: "1",
  displayName: "Sam Lee",
  profilePhotoUrl: null,
  lookingForTeam: false,
  createdAt: "2026-10-17T12:00:00.000Z",
  badges: [],
};

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
    expect(error).toMatchObject({
      status: 500,
      message: "Something went wrong. Please try again.",
    });
  });

  it("explains when the API can't be reached", async () => {
    jest.mocked(fetch).mockRejectedValue(new TypeError("Network request failed"));

    await expect(getMyAccount(user)).rejects.toMatchObject({
      status: 0,
      message: "Can't reach the Rally server. Check your internet connection and try again.",
    });
  });
});

describe("updateMyDisplayName", () => {
  it("sends the display name with a PATCH request", async () => {
    respond(200, { ...account, displayName: "Sam Lee" });

    await expect(updateMyDisplayName(user, "Sam Lee")).resolves.toMatchObject({
      displayName: "Sam Lee",
    });
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users/me", {
      method: "PATCH",
      headers: { Authorization: "Bearer the-token", "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Sam Lee" }),
    });
  });
});

describe("uploadMyProfilePhoto", () => {
  it("uploads the selected browser image with the user's token", async () => {
    const photoResponse = { ok: true, blob: jest.fn().mockResolvedValue(new Blob(["photo"])) };
    const uploadedAccount = { ...account, profilePhotoUrl: "https://signed.example/photo" };
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(photoResponse as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(uploadedAccount),
      } as Response);

    await expect(
      uploadMyProfilePhoto(user, { uri: "blob:photo", mimeType: "image/png" }),
    ).resolves.toEqual(uploadedAccount);

    expect(fetch).toHaveBeenNthCalledWith(1, "blob:photo");
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/users/me/photo",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer the-token" },
        body: expect.any(FormData),
      }),
    );
  });

  it("explains when the selected file can't be read", async () => {
    jest.mocked(fetch).mockRejectedValueOnce(new TypeError("Can't read file"));

    await expect(uploadMyProfilePhoto(user, { uri: "missing:photo" })).rejects.toEqual(
      new ApiError(0, "Couldn't read the selected photo. Please choose it again."),
    );
  });

  it("explains when the photo request can't reach the API", async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(["photo"])),
      } as unknown as Response)
      .mockRejectedValueOnce(new TypeError("Network request failed"));

    await expect(uploadMyProfilePhoto(user, { uri: "blob:photo" })).rejects.toEqual(
      new ApiError(
        0,
        "Can't reach the Rally server. Check your internet connection and try again.",
      ),
    );
  });

  it("passes the API's upload validation message to the caller", async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(["photo"])),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Use a JPEG, PNG, or WebP image." }),
      } as Response);

    await expect(uploadMyProfilePhoto(user, { uri: "blob:photo" })).rejects.toEqual(
      new ApiError(400, "Use a JPEG, PNG, or WebP image."),
    );
  });
});

describe("removeMyProfilePhoto", () => {
  it("removes the profile photo with the user's token", async () => {
    const updatedAccount = { ...account, profilePhotoUrl: null };
    respond(200, updatedAccount);

    await expect(removeMyProfilePhoto(user)).resolves.toEqual(updatedAccount);
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users/me/photo", {
      method: "DELETE",
      headers: { Authorization: "Bearer the-token" },
      body: undefined,
    });
  });
});

describe("getPlayers", () => {
  it("loads the player array with the signed-in user's token", async () => {
    const players = [account];
    respond(200, players);

    await expect(getPlayers(user)).resolves.toEqual(players);
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users", {
      method: "GET",
      headers: { Authorization: "Bearer the-token" },
      body: undefined,
    });
  });
});

describe("updateMyAccount", () => {
  it("sends the change with the user's token and returns the updated account", async () => {
    respond(200, { ...account, lookingForTeam: true });

    await expect(updateMyAccount(user, { lookingForTeam: true })).resolves.toEqual({
      ...account,
      lookingForTeam: true,
    });
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users/me", {
      method: "PATCH",
      headers: { Authorization: "Bearer the-token", "Content-Type": "application/json" },
      body: JSON.stringify({ lookingForTeam: true }),
    });
  });

  it("sends the selected shown badges", async () => {
    respond(200, { ...account, shownBadgeKeys: ["champion", "winner"] });

    await expect(
      updateMyAccount(user, { shownBadgeKeys: ["champion", "winner"] }),
    ).resolves.toMatchObject({
      shownBadgeKeys: ["champion", "winner"],
    });
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users/me", {
      method: "PATCH",
      headers: { Authorization: "Bearer the-token", "Content-Type": "application/json" },
      body: JSON.stringify({ shownBadgeKeys: ["champion", "winner"] }),
    });
  });

  it("fails with the API's message", async () => {
    respond(400, { message: "Some of the details you sent aren't valid." });

    await expect(updateMyAccount(user, { lookingForTeam: true })).rejects.toEqual(
      new ApiError(400, "Some of the details you sent aren't valid."),
    );
  });
});

describe("deleteMyAccount", () => {
  it("sends a DELETE request with the user's token", async () => {
    respond(204);

    await expect(deleteMyAccount(user)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/users/me", {
      method: "DELETE",
      headers: { Authorization: "Bearer the-token" },
      body: undefined,
    });
  });

  it("fails with the API's message", async () => {
    respond(401, { message: "Log in to continue." });

    await expect(deleteMyAccount(user)).rejects.toEqual(new ApiError(401, "Log in to continue."));
  });
});

describe("apiErrorMessage", () => {
  it("uses the API's message", () => {
    expect(apiErrorMessage(new ApiError(0, "Can't reach the Rally server."))).toBe(
      "Can't reach the Rally server.",
    );
  });

  it("uses a general message for other errors", () => {
    expect(apiErrorMessage(new Error("Boom"))).toBe("Something went wrong. Please try again.");
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

it("sends a new name or an app setting", async () => {
  respond(200, { ...account, displayName: "Sam Park", darkMode: true });

  await updateMyAccount(user, { displayName: "Sam Park" });
  expect(fetch).toHaveBeenLastCalledWith("http://localhost:3000/users/me", {
    method: "PATCH",
    headers: { Authorization: "Bearer the-token", "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "Sam Park" }),
  });

  await expect(updateMyAccount(user, { darkMode: true })).resolves.toMatchObject({
    darkMode: true,
  });
  expect(fetch).toHaveBeenLastCalledWith(
    "http://localhost:3000/users/me",
    expect.objectContaining({ body: JSON.stringify({ darkMode: true }) }),
  );
});
