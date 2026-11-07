// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { FastifyReply, FastifyRequest } from "fastify";
import { can, type AccountRole, type Permission } from "./permissions.ts";

// Looks up the account role of a Firebase user, or null if they have no Rally
// account. The users module provides it, so other modules don't read the users table.
export type FindAccountRole = (firebaseUid: string) => Promise<AccountRole | null>;

// Rejects the request unless the logged-in person's role has the permission.
// Add it after requireUser, which sets request.firebaseUid:
//   { preHandler: [requireUser(verifyIdToken), requirePermission(findRole, "tournament:create")] }
// The role is read from the database on every request, so a role change applies at once.
// Hiding a button in the app is never enough: every restricted route needs this check.
export const requirePermission =
  (findRole: FindAccountRole, permission: Permission) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const role = request.firebaseUid ? await findRole(request.firebaseUid) : null;
    if (!role || !can(role, permission))
      return reply.code(403).send({ message: "You don't have permission to do this." });
  };
