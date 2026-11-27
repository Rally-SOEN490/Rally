// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const envFile = join(appDirectory, ".env.local");
if (!existsSync(envFile)) {
  throw new Error(`Missing ${envFile}. Add MAESTRO_EMAIL_BASE and MAESTRO_TEST_PASSWORD.`);
}

process.loadEnvFile(envFile);

const emailBase = process.env.MAESTRO_EMAIL_BASE;
const password = process.env.MAESTRO_TEST_PASSWORD;
if (!emailBase) throw new Error("MAESTRO_EMAIL_BASE is required in apps/app/.env.local.");
if (!password) throw new Error("MAESTRO_TEST_PASSWORD is required in apps/app/.env.local.");

const emailParts = emailBase.split("@");
if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
  throw new Error("MAESTRO_EMAIL_BASE must be a valid email address.");
}

const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 17)}-${process.pid}`;
process.env.MAESTRO_TEST_EMAIL = `${emailParts[0]}+delete-${runId}@${emailParts[1]}`;
process.env.MAESTRO_TEST_NAME = `Disposable Account ${runId}`;

console.log("Running account deletion E2E with a new disposable account.");
const result = spawnSync("maestro", ["test", ".maestro/account-deletion.yaml"], {
  cwd: appDirectory,
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
