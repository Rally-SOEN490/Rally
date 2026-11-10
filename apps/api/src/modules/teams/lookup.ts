// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Database } from "../../db.ts";
import { createTeamRepository } from "./repository.ts";

// What the teams module offers other modules: how many teams each division has,
// and which team a player is on. app.ts passes it to the tournaments module.
export const createTeamLookup = (db: Database) => {
  const teams = createTeamRepository(db);
  return { countByDivision: teams.countByDivision, findTeamOf: teams.findTeamOf };
};

export type TeamLookup = ReturnType<typeof createTeamLookup>;
