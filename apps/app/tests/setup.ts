// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

// The screens show messages with the browser's alert(), which doesn't exist in tests.
globalThis.alert = jest.fn();

// Native glyph rendering is checked on the emulator; unit tests cover the surrounding interactions.
jest.mock("expo-symbols", () => ({
  SymbolView: (props: Record<string, unknown>) =>
    require("react").createElement(require("react-native").View, props),
}));
