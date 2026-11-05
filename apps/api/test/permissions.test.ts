// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { describe, expect, test } from "vitest";
import { accountRoles, can, permissions } from "../src/permissions.ts";

describe("can", () => {
  test.each([
    ["PLAYER", "tournament:create", false],
    ["ORGANIZER", "tournament:create", true],
    ["ADMIN", "tournament:create", true],
  ] as const)("%s may %s: %s", (role, permission, allowed) => {
    expect(can(role, permission)).toBe(allowed);
  });

  // Fails when a role or permission is added without deciding who gets it above.
  test("the table above covers every role and permission", () => {
    expect(accountRoles).toEqual(["PLAYER", "ORGANIZER", "ADMIN"]);
    expect(permissions).toEqual(["tournament:create"]);
  });

  test("an admin may do everything an organizer may", () => {
    for (const permission of permissions)
      if (can("ORGANIZER", permission)) expect(can("ADMIN", permission)).toBe(true);
  });
});
