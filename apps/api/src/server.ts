// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

// Starts the API. Run it with `npm run dev`.
import "dotenv/config";
import { buildApp } from "./app.ts";
import { firebaseTokenVerifier } from "./auth.ts";
import { connectDatabase } from "./db.ts";

const required = (name: string) => {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is missing. Copy .env.example to .env and fill it in.`);
  return value;
};

const db = connectDatabase(required("DATABASE_URL"));
const app = await buildApp({
  db,
  verifyIdToken: firebaseTokenVerifier(required("FIREBASE_PROJECT_ID")),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:8081").split(","),
  logger: true,
});
app.addHook("onClose", () => db.$disconnect());

// On Ctrl+C or a redeploy, finish open requests and close database connections first.
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => void app.close());

// 0.0.0.0 lets phones and emulators on your network reach the API, not just this computer.
await app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
