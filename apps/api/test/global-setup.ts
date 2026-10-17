// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import "dotenv/config";
import { execSync } from "node:child_process";

// Runs once before all tests: brings the test database up to date with the migrations.
export default function setup() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl)
    throw new Error("TEST_DATABASE_URL is missing. Copy .env.example to .env.");
  // Tests delete data, so never let them run against the development database.
  if (testDatabaseUrl === process.env.DATABASE_URL)
    throw new Error("TEST_DATABASE_URL must be a different database from DATABASE_URL.");

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  });
}
