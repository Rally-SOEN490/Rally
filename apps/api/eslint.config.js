// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier/flat";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["src/generated/**", "dist/**", "coverage/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: { globals: globals.node },
    rules: {
      // Keep the existing size debt visible until the code meets the rubric.
      "max-lines": ["warn", { max: 500, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 15],
    },
  },
]);
