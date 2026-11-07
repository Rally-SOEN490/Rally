// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

export const organizerCopy = {
  settingsRow: {
    player: { label: "Become an organizer", value: "Request to host and manage tournaments" },
    organizer: { label: "Organizer account", value: "You can create tournaments" },
  },

  // The request sheet in Settings.
  sheet: {
    title: "Become an organizer",
    close: "Close",
    loading: "Loading your request…",
    retry: "Try again",
    intro: "Tell us about the tournaments you run. A Rally reviewer will approve or deny it.",
    descriptionLabel: "What do you organize?",
    descriptionPlaceholder: "e.g. monthly 6v6 co-ed tournaments in Verdun",
    linkLabel: "Link to past events or your community page (optional)",
    linkPlaceholder: "e.g. instagram.com/verdunvolley",
    invalidLink: "Enter a web address, like instagram.com/yourclub.",
    answerNote: "You'll see the answer here, in Settings.",
    send: "Send request",
    sending: "Sending…",
    sendAgain: "Send a new request",
    pendingTitle: "Request sent",
    pendingMessage: (expiresAt: string) =>
      `A Rally reviewer will answer by ${formatDate(expiresAt)}. You'll see the answer here.`,
    yourRequest: "Your request",
    approvedTitle: "You're an organizer",
    approvedMessage: "Your request was approved. You can now create tournaments.",
    deniedTitle: "Your request was denied",
    deniedReason: (reason: string) => `Reason: ${reason}`,
    deniedNoReason: "No reason was given. You can change your request and send it again.",
    expiredTitle: "Your request expired",
    expiredMessage: "Nobody reviewed it in time. You can send it again.",
    done: "Done",
  },

  // The page a reviewer opens from the email.
  review: {
    pageTitle: "Organizer request",
    loading: "Loading the request…",
    retry: "Try again",
    noToken:
      "This page needs the full link from the review email. Open the link from the email again.",
    openInBrowser: "Open the link from the review email in a web browser to review this request.",
    applicant: "Applicant",
    whatTheyOrganize: "What they organize",
    link: "Link",
    noLink: "No link given",
    submitted: (iso: string) => `Sent on ${formatDate(iso)}`,
    expires: (iso: string) => `This link expires on ${formatDate(iso)}.`,
    approve: "Approve",
    deny: "Deny",
    cancel: "Cancel",
    confirmApproveTitle: (name: string) => `Approve ${name}?`,
    confirmApproveMessage: "They'll be able to create tournaments on Rally.",
    approving: "Approving…",
    reasonLabel: "Reason (optional). The applicant will see it.",
    reasonPlaceholder: "e.g. Add a link to your past tournaments.",
    denyRequest: "Deny request",
    denying: "Denying…",
    status: {
      PENDING: "Waiting for a decision",
      APPROVED: "Approved",
      DENIED: "Denied",
      EXPIRED: "Expired",
    },
    approvedResult: (name: string) => `${name} is now an organizer.`,
    deniedResult: (name: string) => `${name}'s request was denied.`,
    expiredResult: "This request expired before anyone decided. The person can apply again.",
    reasonShown: (reason: string) => `Reason given: ${reason}`,
  },
};
