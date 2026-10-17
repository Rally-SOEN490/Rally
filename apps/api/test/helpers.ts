// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { buildApp } from "../src/app.ts";
import type { VerifyIdToken } from "../src/auth.ts";
import { connectDatabase } from "../src/db.ts";

export const testDb = connectDatabase(process.env.TEST_DATABASE_URL!);

// Stands in for Firebase: the token "token-alice" belongs to the user "alice",
// and any other token is rejected.
const fakeVerifyIdToken: VerifyIdToken = async (token) => {
  if (!token.startsWith("token-")) throw new Error("Invalid token");
  return { uid: token.slice("token-".length) };
};

export const buildTestApp = () =>
  buildApp({ db: testDb, verifyIdToken: fakeVerifyIdToken, corsOrigins: [] });

export const authHeader = (uid: string) => ({ authorization: `Bearer token-${uid}` });
