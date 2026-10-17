// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { expect, test, vi } from "vitest";
import { firebaseTokenVerifier } from "../src/auth.ts";

vi.mock("firebase-admin/app", () => ({ initializeApp: vi.fn(() => "firebase-app") }));
vi.mock("firebase-admin/auth", () => ({ getAuth: vi.fn() }));

test("checks tokens with the Firebase project", async () => {
  const verifyIdToken = vi.fn().mockResolvedValue({ uid: "alice" });
  vi.mocked(getAuth).mockReturnValue({ verifyIdToken } as never);

  const verify = firebaseTokenVerifier("rally-test");

  expect(initializeApp).toHaveBeenCalledWith({ projectId: "rally-test" });
  expect(getAuth).toHaveBeenCalledWith("firebase-app");
  await expect(verify("a-token")).resolves.toEqual({ uid: "alice" });
  expect(verifyIdToken).toHaveBeenCalledWith("a-token");
});
