// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { Session } from "@/lib/session";

// A complete session for tests that mock useSession(). Pass only the parts the
// test cares about; the rest are "logged out" defaults.
export const fakeSession = (overrides: Partial<Session> = {}): Session => ({
  user: null,
  isLoading: false,
  refresh: jest.fn(),
  account: undefined,
  accountError: undefined,
  reloadAccount: jest.fn(),
  setAccount: jest.fn(),
  selectedBadgeKeys: [],
  toggleBadgeSelection: jest.fn(),
  ...overrides,
});
