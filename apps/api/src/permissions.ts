// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// The one place that says which account role may do what. Plain code with no
// framework or database, so tournament code and tests can use it directly.
// docs/architecture/roles-and-permissions.md explains the roles.

export const accountRoles = ["PLAYER", "ORGANIZER", "ADMIN"] as const;
export type AccountRole = (typeof accountRoles)[number];

// Actions that need more than a logged-in account. Anything every player may do
// (edit their profile, browse tournaments) needs no permission here.
export const permissions = ["tournament:create"] as const;
export type Permission = (typeof permissions)[number];

const organizerPermissions: readonly Permission[] = ["tournament:create"];

// Each role lists everything it may do, so a role never depends on another
// role's list changing. An admin can do everything an organizer can; the admin
// dashboard will add its own permissions when it is built.
const rolePermissions: Record<AccountRole, readonly Permission[]> = {
  PLAYER: [],
  ORGANIZER: organizerPermissions,
  ADMIN: organizerPermissions,
};

export const can = (role: AccountRole, permission: Permission): boolean =>
  rolePermissions[role].includes(permission);

// Captain is not an account role: a player is captain of the team they created
// in one tournament (teams don't last across tournaments). Its checks belong
// with teams, and take that team, not the account role.
