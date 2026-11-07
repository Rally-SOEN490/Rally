// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import type {
  DivisionFormat,
  DivisionLevel,
  DivisionType,
  Prisma,
  TournamentStatus,
} from "../../generated/prisma/client.ts";

type Transaction = Prisma.TransactionClient;

export type TournamentFields = {
  name?: string;
  location?: string | null;
  courts?: number | null;
  description?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  registrationOpensAt?: Date | null;
  registrationClosesAt?: Date | null;
};

export type DivisionFields = {
  name: string;
  format: DivisionFormat;
  type: DivisionType;
  levels: DivisionLevel[];
  maxTeams: number;
  priceCents: number;
};

const withDivisions = { divisions: { orderBy: { createdAt: "asc" as const } } };

// The only place that reads and writes the tournaments and divisions tables.
// Functions that take a transaction run inside the caller's.
export const createTournamentRepository = (db: Database) => ({
  // Runs `work` in one transaction. Inside it, run one query at a time.
  inTransaction: <T>(work: (transaction: Transaction) => Promise<T>) => db.$transaction(work),

  create: (organizerId: string, fields: TournamentFields & { name: string }) =>
    db.tournament.create({ data: { ...fields, organizerId }, include: withDivisions }),

  findById: (id: string, transaction: Transaction = db) =>
    transaction.tournament.findUnique({ where: { id }, include: withDivisions }),

  findByOrganizer: (organizerId: string) =>
    db.tournament.findMany({
      where: { organizerId },
      orderBy: [{ startsAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      include: withDivisions,
    }),

  // Published tournaments that haven't ended, for Search: soonest first. Only
  // the organizer's display name comes with them, nothing else about the account.
  findPublishedNotEnded: (now: Date) =>
    db.tournament.findMany({
      where: { status: "PUBLISHED", endsAt: { gt: now } },
      orderBy: [{ startsAt: "asc" }, { name: "asc" }],
      include: { ...withDivisions, organizer: { select: { displayName: true } } },
    }),

  // Locks the tournament until the transaction ends, so a publish and a
  // division change can't run at the same time. Null if it doesn't exist.
  lock: async (id: string, transaction: Transaction) => {
    const rows = await transaction.$queryRaw<
      { organizerId: string; status: TournamentStatus }[]
    >`SELECT organizer_id AS "organizerId", status FROM tournaments WHERE id = ${id}::uuid FOR UPDATE`;
    return rows[0] ?? null;
  },

  update: (id: string, fields: TournamentFields, transaction: Transaction) =>
    transaction.tournament.update({ where: { id }, data: fields }),

  countDivisions: (tournamentId: string, transaction: Transaction) =>
    transaction.division.count({ where: { tournamentId } }),

  createDivision: (tournamentId: string, fields: DivisionFields, transaction: Transaction) =>
    transaction.division.create({ data: { ...fields, tournamentId } }),

  // Returns how many rows changed: 0 means the division isn't in this tournament.
  updateDivision: (
    tournamentId: string,
    divisionId: string,
    fields: Partial<DivisionFields>,
    transaction: Transaction,
  ) => transaction.division.updateMany({ where: { id: divisionId, tournamentId }, data: fields }),

  deleteDivision: (tournamentId: string, divisionId: string, transaction: Transaction) =>
    transaction.division.deleteMany({ where: { id: divisionId, tournamentId } }),

  // Deletes the tournament and, through the foreign key, its divisions.
  delete: (id: string, transaction: Transaction) =>
    transaction.tournament.delete({ where: { id } }),

  publish: (id: string, now: Date, transaction: Transaction) =>
    transaction.tournament.updateMany({
      where: { id, status: "DRAFT" },
      data: { status: "PUBLISHED", publishedAt: now },
    }),
});

export type TournamentRepository = ReturnType<typeof createTournamentRepository>;
