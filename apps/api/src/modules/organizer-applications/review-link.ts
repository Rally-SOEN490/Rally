// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { createHash, randomBytes } from "node:crypto";

// How long reviewers have to decide before the application expires.
export const reviewLinkLifetimeMs = 14 * 24 * 60 * 60 * 1000;

// 32 random bytes, written as 43 URL-safe characters. Impossible to guess.
export const createReviewToken = () => randomBytes(32).toString("base64url");
export const reviewTokenPattern = "^[A-Za-z0-9_-]{43}$";

// Only this hash is stored, so a copy of the database can't be used to decide.
export const hashReviewToken = (token: string) => createHash("sha256").update(token).digest("hex");

// The token goes after "#": browsers never send that part to a server, so it
// stays out of web server and proxy logs. The review page reads it and sends
// it to the API in a request body.
export const reviewUrl = (appUrl: string, token: string) =>
  `${appUrl}/organizer-review#token=${token}`;

export const reviewEmail = ({
  applicantName,
  description,
  link,
  url,
  expiresAt,
}: {
  applicantName: string;
  description: string;
  link: string | null;
  url: string;
  expiresAt: Date;
}) => ({
  subject: `Rally: ${applicantName} wants to become an organizer`,
  body: [
    `${applicantName} asked to become an organizer on Rally, so they can create tournaments.`,
    "",
    "What they organize:",
    description,
    "",
    `Link: ${link ?? "none given"}`,
    "",
    "Approve or deny the request here:",
    url,
    "",
    `The link expires on ${expiresAt.toISOString().slice(0, 10)}. The first reviewer to decide settles the request.`,
    "Anyone with this link can decide, so don't forward this email.",
  ].join("\n"),
});
