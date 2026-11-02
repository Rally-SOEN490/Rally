// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");

module.exports = defineConfig([
  { ignores: ["dist/**", "coverage/**", ".expo/**", "expo-env.d.ts", "ios/**", "android/**"] },
  expoConfig,
  prettierConfig,
  {
    rules: {
      // Keep the existing size debt visible until the code meets the rubric.
      "max-lines": ["warn", { max: 500, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 15],
    },
  },
]);
