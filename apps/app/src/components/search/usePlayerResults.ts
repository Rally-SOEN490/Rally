// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { apiErrorMessage, getPlayers, type RallyPlayer } from "@/lib/api";

// Loads the player directory while the Players tab is open. Changing user or
// calling retry loads it again from scratch.
export function usePlayerResults(active: boolean, user: User | null) {
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [players, setPlayers] = useState<RallyPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!active || !user) return;

    let isCurrent = true;
    // Reset stale results when the signed-in user, tab, or retry request changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayers([]);
    setError(undefined);
    setLoading(true);

    getPlayers(user)
      .then((result) => {
        if (isCurrent) setPlayers(result);
      })
      .catch((caught) => {
        if (isCurrent) setError(apiErrorMessage(caught));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [active, user, retryAttempt]);

  const retry = () => setRetryAttempt((attempt) => attempt + 1);

  return { players, loading, error, retry };
}
