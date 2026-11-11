// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import {
  applyToBeOrganizer,
  decideApplication,
  getApplicationForReview,
  getMyOrganizerApplication,
  normalizeLink,
  reviewTokenFromHash,
} from "@/lib/organizer-applications";

jest.mock("react-native", () => ({ Platform: { OS: "web" } }));

const user = { getIdToken: jest.fn().mockResolvedValue("the-token") } as unknown as User;
const token = "a".repeat(43);

const respond = (status: number, body: object) =>
  jest.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

beforeEach(() => {
  globalThis.fetch = jest.fn();
});

describe("normalizeLink", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["instagram.com/verdunvolley", "https://instagram.com/verdunvolley"],
    [" https://club.ca/events ", "https://club.ca/events"],
    ["http://club.ca", "http://club.ca"],
  ])("turns %j into %j", (text, expected) => {
    expect(normalizeLink(text)).toBe(expected);
  });

  it.each(["not a link", "club", "https://", "https://club ca", "https://.club", "https://club."])("rejects %j", (text) => {
    expect(normalizeLink(text)).toBeUndefined();
  });
});

describe("reviewTokenFromHash", () => {
  it("reads the token from the review link", () => {
    expect(reviewTokenFromHash(`#token=${token}`)).toBe(token);
  });

  it.each(["", "#", "#token=short", `#token=${token}!`, `?token=${token}`])(
    "finds no token in %j",
    (hash) => {
      expect(reviewTokenFromHash(hash)).toBeNull();
    },
  );
});

it("loads the person's latest request with their login", async () => {
  respond(200, { application: null });

  await expect(getMyOrganizerApplication(user)).resolves.toBeNull();
  expect(fetch).toHaveBeenCalledWith("http://localhost:3000/organizer-applications/me", {
    method: "GET",
    headers: { Authorization: "Bearer the-token" },
    body: undefined,
  });
});

it("sends a request with the person's login", async () => {
  respond(201, { id: "1", status: "PENDING" });

  await applyToBeOrganizer(user, { description: "6v6", link: null });

  expect(fetch).toHaveBeenCalledWith("http://localhost:3000/organizer-applications", {
    method: "POST",
    headers: { Authorization: "Bearer the-token", "Content-Type": "application/json" },
    body: JSON.stringify({ description: "6v6", link: null }),
  });
});

it("reviews without a login, with the token in the body", async () => {
  respond(200, { status: "PENDING" });

  await getApplicationForReview(token);
  await decideApplication(token, "deny", "Add a link");

  expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:3000/organizer-applications/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "http://localhost:3000/organizer-applications/review/decision",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, decision: "deny", reason: "Add a link" }),
    },
  );
});
