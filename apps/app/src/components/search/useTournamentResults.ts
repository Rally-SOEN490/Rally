// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import { getTournaments, type Tournament } from "@/lib/tournaments";

// Loads tournaments each time Search comes back into view, not just once:
// the tabs keep this screen loaded, so without this a tournament published
// from Events a moment ago wouldn't be listed. Results already on screen stay
// while the new ones load.
export function useTournamentResults(active: boolean, user: User | null) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(() => {
    if (!active || !user) return;

    let isCurrent = true;
    setError(undefined);
    setLoading(true);

    getTournaments(user)
      .then((result) => {
        if (isCurrent) setTournaments(result);
      })
      .catch((caught) => {
        if (isCurrent) setError(apiErrorMessage(caught));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    // Leaving Search ignores an answer that arrives afterwards.
    return () => {
      isCurrent = false;
    };
  }, [active, user]);
  useFocusEffect(load);

  return { tournaments, loading, error, retry: load };
}
