// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["dotenv/config"],
    globalSetup: ["./test/global-setup.ts"],
    // The test files share one database, so run them one at a time.
    fileParallelism: false,
  },
});
