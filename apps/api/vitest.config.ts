// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["dotenv/config"],
    globalSetup: ["./test/global-setup.ts"],
    // The test files share one database, so run them one at a time.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Prisma writes the generated code, and server.ts only starts the API.
      exclude: ["src/generated/**", "src/server.ts"],
      // "lcov" is the report SonarQube reads. Its paths start at the repo root
      // (apps/api/src/...) so SonarQube can't confuse them with the app's src folder.
      reporter: ["text", ["lcov", { projectRoot: "../.." }]],
    },
  },
});
