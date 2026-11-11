// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { apiErrorMessage, updateMyAccount } from "@/lib/api";
import type { Session } from "@/lib/session";

// The "Looking for a team" switch. The switch shows the new value right away;
// the badge on the profile waits for the server.
export function useLookingForTeam({ user, account, setAccount }: Session) {
  const lookingForTeam = account?.lookingForTeam ?? false;
  const [savingValue, setSavingValue] = useState<boolean>();
  const [error, setError] = useState("");

  const change = async (value: boolean) => {
    if (!user) return;
    setSavingValue(value);
    setError("");
    try {
      setAccount(await updateMyAccount(user, { lookingForTeam: value }));
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSavingValue(undefined);
    }
  };

  return {
    lookingForTeam,
    switchValue: savingValue ?? lookingForTeam,
    saving: savingValue !== undefined,
    error,
    change,
  };
}
