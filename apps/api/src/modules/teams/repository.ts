// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

export type Transaction = Prisma.TransactionClient;

export type NewTeam = { tournamentId: string; divisionId: string; name: string; nameKey: string };

// The only place that reads and writes the teams and team_members tables.
// Functions that take a transaction run inside the caller's.
export const createTeamRepository = (db: Database) => ({
  // Runs `work` in one transaction. Inside it, run one query at a time.
  inTransaction: <T>(work: (transaction: Transaction) => Promise<T>) => db.$transaction(work),

  countInDivision: (divisionId: string, transaction: Transaction) =>
    transaction.team.count({ where: { divisionId } }),

  isOnATeam: async (tournamentId: string, userId: string, transaction: Transaction) =>
    !!(await transaction.teamMember.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
      select: { teamId: true },
    })),

  isNameTaken: async (tournamentId: string, nameKey: string, transaction: Transaction) =>
    !!(await transaction.team.findUnique({
      where: { tournamentId_nameKey: { tournamentId, nameKey } },
      select: { id: true },
    })),

  // The team, with its creator as captain and first player.
  createWithCaptain: (team: NewTeam, captainId: string, transaction: Transaction) =>
    transaction.team.create({
      data: { ...team, members: { create: { userId: captainId, isCaptain: true } } },
      select: { id: true, name: true, divisionId: true },
    }),

  // Takes a player off every team they are on and deletes the teams left with
  // nobody, so those no longer take a spot or a name. Runs in the caller's
  // transaction, before their account is deleted.
  leaveAllTeams: async (userId: string, transaction: Transaction) => {
    const memberships = await transaction.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });
    if (memberships.length === 0) return;
    await transaction.teamMember.deleteMany({ where: { userId } });
    await transaction.team.deleteMany({
      where: { id: { in: memberships.map(({ teamId }) => teamId) }, members: { none: {} } },
    });
  },

  // How many teams each division has. Divisions without teams are left out.
  countByDivision: async (divisionIds: string[]) => {
    if (divisionIds.length === 0) return new Map<string, number>();
    const rows = await db.team.groupBy({
      by: ["divisionId"],
      where: { divisionId: { in: divisionIds } },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.divisionId, row._count._all]));
  },

  // The team a player is on in a tournament, or null.
  findTeamOf: async (tournamentId: string, userId: string) => {
    const membership = await db.teamMember.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
      select: { isCaptain: true, team: { select: { id: true, name: true, divisionId: true } } },
    });
    return membership && { ...membership.team, isCaptain: membership.isCaptain };
  },
});

export type TeamRepository = ReturnType<typeof createTeamRepository>;
