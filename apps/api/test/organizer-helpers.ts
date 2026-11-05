// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { VerifyIdToken } from "../src/auth.ts";
import type { Database } from "../src/db.ts";

// Stands in for Firebase, like helpers.ts: "token-alice" belongs to "alice".
export const fakeVerifyIdToken: VerifyIdToken = async (token) => {
  if (!token.startsWith("token-")) throw new Error("Invalid token");
  return { uid: token.slice("token-".length) };
};

export const sampleApplication = {
  description: "Monthly 6v6 co-ed tournaments in Verdun",
  link: "https://instagram.com/verdunvolley",
};

// Reads the review token from the newest queued email, as a reviewer would
// from the link in their inbox.
export const reviewTokenFrom = async (db: Database) => {
  const email = await db.emailOutbox.findFirstOrThrow({ orderBy: { createdAt: "desc" } });
  const token = /#token=([A-Za-z0-9_-]+)/.exec(email.body ?? "")?.[1];
  if (!token) throw new Error("The email has no review link.");
  return token;
};
