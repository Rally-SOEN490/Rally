// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

export type Config = {
  databaseUrl: string;
  firebaseProjectId: string;
  port: number;
  corsOrigins: string[];
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  } | null;
  email: {
    // Without a key, emails are printed in the API log instead of sent.
    resendApiKey: string | null;
    from: string;
  };
  // Who receives organizer applications. Empty means nobody is emailed.
  organizerReviewerEmails: string[];
  // The web app's address, used for links in emails.
  appUrl: string;
};

// Loose on purpose: Resend does the real check. This catches typos like a missing "@".
const looksLikeEmail = (value: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value);

const readEmailList = (name: string, value: string | undefined) => {
  const emails = (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const invalid = emails.filter((email) => !looksLikeEmail(email));
  if (invalid.length > 0)
    throw new Error(`${name} has an invalid email address: ${invalid.join(", ")}`);
  return emails;
};

// Reads the API's settings from environment variables (locally, from the .env file).
export const loadConfig = (env: NodeJS.ProcessEnv): Config => {
  const required = (name: string) => {
    const value = env[name];
    if (!value) throw new Error(`${name} is missing. Copy .env.example to .env and fill it in.`);
    return value;
  };

  const r2Names = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
  const configuredR2Names = r2Names.filter((name) => Boolean(env[name]));
  if (configuredR2Names.length > 0 && configuredR2Names.length < r2Names.length)
    throw new Error("R2 settings are incomplete. Configure all R2_* values or leave them blank.");

  return {
    databaseUrl: required("DATABASE_URL"),
    firebaseProjectId: required("FIREBASE_PROJECT_ID"),
    port: Number(env.PORT ?? 3000),
    corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:8081").split(","),
    r2:
      configuredR2Names.length === 0
        ? null
        : {
            accountId: env.R2_ACCOUNT_ID!,
            accessKeyId: env.R2_ACCESS_KEY_ID!,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
            bucketName: env.R2_BUCKET_NAME!,
          },
    email: {
      resendApiKey: env.RESEND_API_KEY || null,
      // Resend's test sender. It only delivers to the Resend account's own address;
      // set EMAIL_FROM to an address on a verified domain to email anyone.
      from: env.EMAIL_FROM || "Rally <onboarding@resend.dev>",
    },
    organizerReviewerEmails: readEmailList(
      "ORGANIZER_REVIEWER_EMAILS",
      env.ORGANIZER_REVIEWER_EMAILS,
    ),
    appUrl: (env.APP_URL || "http://localhost:8081").replace(/\/+$/, ""),
  };
};
