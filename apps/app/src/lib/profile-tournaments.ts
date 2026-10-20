// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { User } from "firebase/auth";
import { request } from "./api";
export type UpcomingTournament = { id: string; eventName: string; tournamentName: string; teamName: string; format: string; startsAt: string };
export const getUpcomingTournaments = (user: User): Promise<{ tournaments: UpcomingTournament[] }> => request(user, "GET", "/profiles/me/upcoming");
