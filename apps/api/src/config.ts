// Copyright (c) 2026 Rally. All rights reserved.

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
  };
};
