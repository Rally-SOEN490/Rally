// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";

export type Database = PrismaClient;

// Each client keeps a pool of connections, so create one per process and share it.
export const connectDatabase = (connectionString: string): Database =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
