// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

// The screens show messages with the browser's alert(), which doesn't exist in tests.
globalThis.alert = jest.fn();
