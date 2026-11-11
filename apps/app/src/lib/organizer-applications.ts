// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import { request } from "@/lib/api";

export type ApplicationStatus = "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";

export type OrganizerApplication = {
  id: string;
  status: ApplicationStatus;
  description: string;
  link: string | null;
  denyReason: string | null;
  createdAt: string;
  expiresAt: string;
  decidedAt: string | null;
};

// What a reviewer sees through the link in their email.
export type ApplicationForReview = Omit<OrganizerApplication, "id"> & { applicantName: string };

export const DESCRIPTION_MAX_LENGTH = 1000;
export const REASON_MAX_LENGTH = 500;

// A host with a dot inside it, then anything. Plain string checks instead of
// one regex, so there is no backtracking on long input.
const isWebAddress = (link: string): boolean => {
  if (/\s/.test(link)) return false;
  const afterScheme = link.slice(link.indexOf("//") + 2);
  const slash = afterScheme.indexOf("/");
  const host = slash === -1 ? afterScheme : afterScheme.slice(0, slash);
  const dot = host.indexOf(".");
  return dot > 0 && (dot < host.length - 1 || slash !== -1);
};

// Adds "https://" when someone types "instagram.com/club". Returns null for a
// blank link and undefined for one that still isn't a web address.
export const normalizeLink = (text: string): string | null | undefined => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const link = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return isWebAddress(link) ? link : undefined;
};

// The person's latest application, or null if they never applied.
export const getMyOrganizerApplication = async (user: User): Promise<OrganizerApplication | null> =>
  (await request(user, "GET", "/organizer-applications/me")).application;

export const applyToBeOrganizer = (
  user: User,
  application: { description: string; link: string | null },
): Promise<OrganizerApplication> => request(user, "POST", "/organizer-applications", application);

// Reviewers don't log in: the token from their email link is the permission.
export const getApplicationForReview = (token: string): Promise<ApplicationForReview> =>
  request(null, "POST", "/organizer-applications/review", { token });

export const decideApplication = (
  token: string,
  decision: "approve" | "deny",
  reason: string | null,
): Promise<ApplicationForReview> =>
  request(null, "POST", "/organizer-applications/review/decision", { token, decision, reason });

// Reads the token from a review link (…/organizer-review#token=…).
export const reviewTokenFromHash = (hash: string) =>
  /(?:^#|&)token=([A-Za-z0-9_-]{43})(?:&|$)/.exec(hash)?.[1] ?? null;
