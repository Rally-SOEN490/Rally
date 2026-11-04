// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Starts the API. Run it with `npm run dev`. This file only connects the pieces;
// tests build the API with buildApp() instead.
import "dotenv/config";
import { buildApp } from "./app.ts";
import { firebaseTokenVerifier } from "./auth.ts";
import { loadConfig } from "./config.ts";
import { connectDatabase } from "./db.ts";
import { createEmailOutbox } from "./modules/email/outbox.ts";
import { createEmailSender, logTransport, resendTransport } from "./modules/email/sender.ts";
import { createProfilePhotoStorage } from "./modules/users/photo-storage.ts";

const config = loadConfig(process.env);
const db = connectDatabase(config.databaseUrl);
const photos = config.r2 ? createProfilePhotoStorage(config.r2) : undefined;

const emails = createEmailSender({
  outbox: createEmailOutbox(db),
  transport: config.email.resendApiKey
    ? resendTransport(config.email.resendApiKey, config.email.from)
    : logTransport(console.log),
  onError: (id, error) => app.log.warn({ emailId: id, err: error }, "Email not sent; will retry"),
});
const deliverEmails = () =>
  void emails.deliverDue().catch((error) => app.log.error(error, "Email sender failed"));

const app = await buildApp({
  db,
  verifyIdToken: firebaseTokenVerifier(config.firebaseProjectId),
  corsOrigins: config.corsOrigins,
  photos,
  logger: true,
  organizerApplications: {
    reviewerEmails: config.organizerReviewerEmails,
    appUrl: config.appUrl,
    onEmailsQueued: deliverEmails,
  },
});

if (config.organizerReviewerEmails.length === 0)
  app.log.warn("ORGANIZER_REVIEWER_EMAILS is empty: nobody is emailed organizer applications.");
if (!config.email.resendApiKey)
  app.log.warn(
    "RESEND_API_KEY is not set: emails, including review links, are printed here instead of sent. Local development only.",
  );

// Retries emails that failed and sends any left over from before a restart.
const emailTimer = setInterval(deliverEmails, 30_000);
deliverEmails();

app.addHook("onClose", async () => {
  clearInterval(emailTimer);
  await emails.deliverDue().catch(() => undefined);
  await db.$disconnect();
});

// On Ctrl+C or a redeploy, finish open requests and close database connections first.
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => void app.close());

// 0.0.0.0 lets phones and emulators on your network reach the API, not just this computer.
await app.listen({ port: config.port, host: "0.0.0.0" });
