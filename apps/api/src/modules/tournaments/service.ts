// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import {
  checkDates,
  duplicateDivisionName,
  findAccountId,
  httpError,
  isUniqueViolation,
  lockOwnDraft,
  notFound,
  toDivisionFields,
  toFields,
  toPageResponse,
  toPublishedResponse,
  toResponse,
  type Accounts,
  type Deps,
  type DivisionInput,
  type Stored,
  type Teams,
  type TournamentInput,
} from "./mapping.ts";
import { can } from "../../permissions.ts";
import type { DivisionFields, TournamentRepository } from "./repository.ts";
import { publishProblems } from "./rules.ts";

// The route checks the caller may create tournaments (organizer or admin).
const create = async (
  deps: Deps,
  firebaseUid: string,
  input: TournamentInput & { name: string },
) => {
  const organizerId = await findAccountId(deps, firebaseUid);
  const fields = toFields(input);
  checkDates({}, fields);
  return toResponse(await deps.tournaments.create(organizerId, { ...fields, name: fields.name! }));
};

// How many teams each division of these tournaments has, in one query.
const countTeams = (deps: Deps, tournaments: Pick<Stored, "divisions">[]) =>
  deps.teams.countByDivision(
    tournaments.flatMap((tournament) => tournament.divisions.map(({ id }) => id)),
  );

const listMine = async (deps: Deps, firebaseUid: string) => {
  const organizerId = await findAccountId(deps, firebaseUid);
  const tournaments = await deps.tournaments.findByOrganizer(organizerId);
  const counts = await countTeams(deps, tournaments);
  return tournaments.map((tournament) => toResponse(tournament, counts));
};

// Every signed-in player sees these in Search. A tournament leaves the list once it ends.
const listPublished = async (deps: Deps) => {
  const tournaments = await deps.tournaments.findPublishedNotEnded(deps.now());
  const counts = await countTeams(deps, tournaments);
  return tournaments.map((tournament) => toPublishedResponse(tournament, counts));
};

// A tournament's page (#301, #285). Any logged-in account sees a published
// tournament; a draft only its organizer, and anyone else gets "not found", so
// nobody learns that a draft exists. An organizer who has been demoted counts as
// a player, like on the other tournament routes, so they lose their drafts.
const getPage = async (deps: Deps, firebaseUid: string, tournamentId: string) => {
  const account = await deps.accounts.findAccount(firebaseUid);
  const tournament = await deps.tournaments.findWithOrganizer(tournamentId);
  const isOrganizer =
    !!tournament &&
    !!account &&
    tournament.organizerId === account.id &&
    can(account.role, "tournament:create");
  if (!tournament || (tournament.status !== "PUBLISHED" && !isOrganizer)) throw notFound();
  const myTeam = account ? await deps.teams.findTeamOf(tournament.id, account.id) : null;
  const counts = await countTeams(deps, [tournament]);
  return toPageResponse(tournament, { isOrganizer, myTeam }, counts, deps.now());
};

// Runs `change` on the caller's own draft inside one transaction, then returns the result.
const changeOwnDraft = async (
  deps: Deps,
  firebaseUid: string,
  tournamentId: string,
  change: (
    transaction: Parameters<Parameters<TournamentRepository["inTransaction"]>[0]>[0],
  ) => Promise<unknown>,
) => {
  const organizerId = await findAccountId(deps, firebaseUid);
  try {
    await deps.tournaments.inTransaction(async (transaction) => {
      await lockOwnDraft(deps, organizerId, tournamentId, transaction);
      await change(transaction);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicateDivisionName();
    throw error;
  }
  return toResponse((await deps.tournaments.findById(tournamentId))!);
};

const update = (deps: Deps, firebaseUid: string, tournamentId: string, input: TournamentInput) =>
  changeOwnDraft(deps, firebaseUid, tournamentId, async (transaction) => {
    const changes = toFields(input);
    checkDates((await deps.tournaments.findById(tournamentId, transaction))!, changes);
    await deps.tournaments.update(tournamentId, changes, transaction);
  });

const addDivision = (deps: Deps, firebaseUid: string, tournamentId: string, input: DivisionInput) =>
  changeOwnDraft(deps, firebaseUid, tournamentId, (transaction) =>
    deps.tournaments.createDivision(
      tournamentId,
      toDivisionFields(input) as DivisionFields,
      transaction,
    ),
  );

const updateDivision = (
  deps: Deps,
  firebaseUid: string,
  tournamentId: string,
  divisionId: string,
  input: Partial<DivisionInput>,
) =>
  changeOwnDraft(deps, firebaseUid, tournamentId, async (transaction) => {
    const changed = await deps.tournaments.updateDivision(
      tournamentId,
      divisionId,
      toDivisionFields(input),
      transaction,
    );
    if (changed.count === 0) throw httpError(404, "Division not found.");
  });

const removeDivision = (
  deps: Deps,
  firebaseUid: string,
  tournamentId: string,
  divisionId: string,
) =>
  changeOwnDraft(deps, firebaseUid, tournamentId, async (transaction) => {
    const removed = await deps.tournaments.deleteDivision(tournamentId, divisionId, transaction);
    if (removed.count === 0) throw httpError(404, "Division not found.");
  });

// Checks the draft is complete, then publishes it. The tournament stays locked
// meanwhile, so no division can be removed between the check and the publish.
const publish = (deps: Deps, firebaseUid: string, tournamentId: string) =>
  changeOwnDraft(deps, firebaseUid, tournamentId, async (transaction) => {
    const tournament = (await deps.tournaments.findById(tournamentId, transaction))!;
    const divisionCount = await deps.tournaments.countDivisions(tournamentId, transaction);
    const now = deps.now();
    const problems = publishProblems({ ...tournament, divisionCount }, now);
    if (problems.length > 0) throw httpError(400, `Not ready to publish. ${problems.join(" ")}`);
    await deps.tournaments.publish(tournamentId, now, transaction);
  });

// Deletes one of the caller's drafts. A published tournament can't be deleted
// here; cancelling it is #81.
const deleteDraft = async (deps: Deps, firebaseUid: string, tournamentId: string) => {
  const organizerId = await findAccountId(deps, firebaseUid);
  await deps.tournaments.inTransaction(async (transaction) => {
    await lockOwnDraft(deps, organizerId, tournamentId, transaction);
    await deps.tournaments.delete(tournamentId, transaction);
  });
};

export const createTournamentService = (dependencies: {
  tournaments: TournamentRepository;
  accounts: Accounts;
  teams: Teams;
  now?: () => Date;
}) => {
  const deps: Deps = { ...dependencies, now: dependencies.now ?? (() => new Date()) };
  return {
    create: (firebaseUid: string, input: TournamentInput & { name: string }) =>
      create(deps, firebaseUid, input),
    listPublished: () => listPublished(deps),
    listMine: (firebaseUid: string) => listMine(deps, firebaseUid),
    getPage: (firebaseUid: string, id: string) => getPage(deps, firebaseUid, id),
    update: (firebaseUid: string, id: string, input: TournamentInput) =>
      update(deps, firebaseUid, id, input),
    addDivision: (firebaseUid: string, id: string, input: DivisionInput) =>
      addDivision(deps, firebaseUid, id, input),
    updateDivision: (
      firebaseUid: string,
      id: string,
      divisionId: string,
      input: Partial<DivisionInput>,
    ) => updateDivision(deps, firebaseUid, id, divisionId, input),
    removeDivision: (firebaseUid: string, id: string, divisionId: string) =>
      removeDivision(deps, firebaseUid, id, divisionId),
    publish: (firebaseUid: string, id: string) => publish(deps, firebaseUid, id),
    deleteDraft: (firebaseUid: string, id: string) => deleteDraft(deps, firebaseUid, id),
  };
};
