// Copyright (c) 2026 Rally. All rights reserved.

// Starts the API. Run it with `npm run dev`. This file only connects the pieces;
// tests build the API with buildApp() instead.
import "dotenv/config";
import { buildApp } from "./app.ts";
import { firebaseTokenVerifier } from "./auth.ts";
import { loadConfig } from "./config.ts";
import { connectDatabase } from "./db.ts";

const config = loadConfig(process.env);
const db = connectDatabase(config.databaseUrl);
const app = await buildApp({
  db,
  verifyIdToken: firebaseTokenVerifier(config.firebaseProjectId),
  corsOrigins: config.corsOrigins,
  logger: true,
});
app.addHook("onClose", () => db.$disconnect());

// On Ctrl+C or a redeploy, finish open requests and close database connections first.
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => void app.close());

// 0.0.0.0 lets phones and emulators on your network reach the API, not just this computer.
await app.listen({ port: config.port, host: "0.0.0.0" });
