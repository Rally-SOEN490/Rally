// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Prisma } from "../../generated/prisma/client.ts";
import type { AccountRole } from "../../permissions.ts";
import type { NewEmail } from "../email/outbox.ts";
import type { OrganizerApplicationRepository } from "./repository.ts";
import {
  createReviewToken,
  hashReviewToken,
  reviewEmail,
  reviewLinkLifetimeMs,
  reviewUrl,
} from "./review-link.ts";

type ApplicationStatus = "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";

// What this module needs from the users module, passed in by app.ts.
export type Applicants = {
  findApplicant: (
    firebaseUid: string,
  ) => Promise<{ id: string; displayName: string; role: AccountRole } | null>;
  promoteToOrganizer: (userId: string, transaction: Prisma.TransactionClient) => Promise<unknown>;
};

export type ApplicationResponse = {
  id: string;
  status: ApplicationStatus;
  description: string;
  link: string | null;
  denyReason: string | null;
  createdAt: string;
  expiresAt: string;
  decidedAt: string | null;
};

// What a reviewer sees: the application and the applicant's name, nothing else
// about them (no email address, no Firebase ID).
export type ReviewResponse = Omit<ApplicationResponse, "id"> & { applicantName: string };

type Dependencies = {
  applications: OrganizerApplicationRepository;
  applicants: Applicants;
  enqueueEmails: (emails: NewEmail[], transaction: Prisma.TransactionClient) => Promise<void>;
  reviewerEmails: string[];
  appUrl: string;
  // Called after emails are saved, to send them right away instead of at the next check.
  onEmailsQueued?: () => void;
  now?: () => Date;
};
type Deps = Required<Dependencies>;

type StoredApplication = NonNullable<
  Awaited<ReturnType<OrganizerApplicationRepository["findLatestForUser"]>>
>;
type ApplicationWithApplicant = NonNullable<
  Awaited<ReturnType<OrganizerApplicationRepository["findByTokenHash"]>>
>;

const toResponse = (application: StoredApplication): ApplicationResponse => ({
  id: application.id,
  status: application.status,
  description: application.description,
  link: application.link,
  denyReason: application.denyReason,
  createdAt: application.createdAt.toISOString(),
  expiresAt: application.expiresAt.toISOString(),
  decidedAt: application.decidedAt?.toISOString() ?? null,
});

const toReviewResponse = ({ user, ...application }: ApplicationWithApplicant): ReviewResponse => {
  const response: Partial<ApplicationResponse> = toResponse(application);
  delete response.id;
  return { applicantName: user.displayName, ...(response as Omit<ApplicationResponse, "id">) };
};

// Errors whose message the app shows; app.ts sends them with this status code.
const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

const blankToNull = (text: string | null | undefined) => text?.trim() || null;

const findApplicant = async (deps: Deps, firebaseUid: string) => {
  const applicant = await deps.applicants.findApplicant(firebaseUid);
  if (!applicant) throw httpError(404, "No Rally account found.");
  return applicant;
};

// Finds the application a review link belongs to, marking it expired first if
// its time ran out.
const findForReview = async (deps: Deps, token: string) => {
  const tokenHash = hashReviewToken(token);
  const application = await deps.applications.findByTokenHash(tokenHash);
  if (!application) throw httpError(404, "This review link isn't valid.");
  const expired = await deps.applications.expireDue({ id: application.id }, deps.now());
  if (expired.count === 0) return application;
  return (await deps.applications.findByTokenHash(tokenHash))!;
};

const apply = async (
  deps: Deps,
  firebaseUid: string,
  form: { description: string; link?: string | null },
) => {
  const applicant = await findApplicant(deps, firebaseUid);
  if (applicant.role !== "PLAYER") throw httpError(409, "You're already an organizer.");

  const now = deps.now();
  const token = createReviewToken();
  const expiresAt = new Date(now.getTime() + reviewLinkLifetimeMs);
  const description = form.description.trim();
  const link = blankToNull(form.link);
  const email = reviewEmail({
    applicantName: applicant.displayName,
    description,
    link,
    url: reviewUrl(deps.appUrl, token),
    expiresAt,
  });
  const fields = { userId: applicant.id, description, link, expiresAt };

  try {
    const application = await deps.applications.inTransaction(async (transaction) => {
      // An expired application no longer counts as pending.
      await deps.applications.expireDue({ userId: applicant.id }, now, transaction);
      const created = await deps.applications.create(
        { ...fields, reviewTokenHash: hashReviewToken(token) },
        transaction,
      );
      const emails = deps.reviewerEmails.map((recipient) => ({ recipient, ...email }));
      await deps.enqueueEmails(emails, transaction);
      return created;
    });
    if (deps.reviewerEmails.length > 0) deps.onEmailsQueued();
    return toResponse(application);
  } catch (error) {
    if (isUniqueViolation(error))
      throw httpError(409, "You already have an application waiting for review.");
    throw error;
  }
};

// The first decision wins. Approving makes the applicant an organizer in the
// same transaction, so the application and the role never disagree.
const decide = async (
  deps: Deps,
  token: string,
  decision: "approve" | "deny",
  reason?: string | null,
) => {
  const application = await findForReview(deps, token);
  const now = deps.now();
  const decided = await deps.applications.inTransaction(async (transaction) => {
    const changed = await deps.applications.decide(
      application.id,
      {
        status: decision === "approve" ? "APPROVED" : "DENIED",
        denyReason: decision === "deny" ? blankToNull(reason) : null,
        now,
      },
      transaction,
    );
    if (changed.count === 0) return false;
    if (decision === "approve")
      await deps.applicants.promoteToOrganizer(application.userId, transaction);
    return true;
  });

  const current = await findForReview(deps, token);
  if (decided) return toReviewResponse(current);
  if (current.status === "EXPIRED")
    throw httpError(410, "This review link has expired. The person can apply again.");
  const outcome = current.status === "APPROVED" ? "approved" : "denied";
  throw httpError(409, `This request was already ${outcome}.`);
};

// The person's most recent application, or null if they never applied.
const getLatest = async (deps: Deps, firebaseUid: string) => {
  const applicant = await findApplicant(deps, firebaseUid);
  await deps.applications.expireDue({ userId: applicant.id }, deps.now());
  const application = await deps.applications.findLatestForUser(applicant.id);
  return application ? toResponse(application) : null;
};

export const createOrganizerApplicationService = (dependencies: Dependencies) => {
  // `??`, not spread defaults: routes pass onEmailsQueued as undefined when it isn't set.
  const deps: Deps = {
    ...dependencies,
    onEmailsQueued: dependencies.onEmailsQueued ?? (() => {}),
    now: dependencies.now ?? (() => new Date()),
  };
  return {
    apply: (firebaseUid: string, form: { description: string; link?: string | null }) =>
      apply(deps, firebaseUid, form),
    getLatest: (firebaseUid: string) => getLatest(deps, firebaseUid),
    getForReview: async (token: string) => toReviewResponse(await findForReview(deps, token)),
    decide: (token: string, decision: "approve" | "deny", reason?: string | null) =>
      decide(deps, token, decision, reason),
  };
};
