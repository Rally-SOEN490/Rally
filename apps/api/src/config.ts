// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

export type Config = {
  databaseUrl: string;
  firebaseProjectId: string;
  port: number;
  corsOrigins: string[];
};

// Reads the API's settings from environment variables (locally, from the .env file).
export const loadConfig = (env: NodeJS.ProcessEnv): Config => {
  const required = (name: string) => {
    const value = env[name];
    if (!value)
      throw new Error(`${name} is missing. Copy .env.example to .env and fill it in.`);
    return value;
  };

  return {
    databaseUrl: required("DATABASE_URL"),
    firebaseProjectId: required("FIREBASE_PROJECT_ID"),
    port: Number(env.PORT ?? 3000),
    corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:8081").split(","),
  };
};
