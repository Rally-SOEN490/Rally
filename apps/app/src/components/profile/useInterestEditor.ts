// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { apiErrorMessage, updateMyAccount } from "@/lib/api";
import { type InterestCategory } from "@/lib/interests";
import type { Session } from "@/lib/session";

type InterestSelection = Record<InterestCategory, string[]>;

// Adds the key to the category, or removes it when it's already there.
const toggledSelection = (
  selection: InterestSelection,
  category: InterestCategory,
  key: string,
): InterestSelection => ({
  ...selection,
  [category]: selection[category].includes(key)
    ? selection[category].filter((selectedKey) => selectedKey !== key)
    : [...selection[category], key],
});

// The interest tags on the profile. A tap saves straight away and is undone if
// the server refuses it.
export function useInterestEditor({ user, account, setAccount }: Session) {
  const [selection, setSelection] = useState<InterestSelection>(() => ({
    formats: account?.interests?.formats ?? [],
    positions: account?.interests?.positions ?? [],
    clubs: account?.interests?.clubs ?? [],
    other: account?.interests?.other ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = async (category: InterestCategory, key: string) => {
    if (!user || saving) return;
    const previousSelection = selection;
    const nextSelection = toggledSelection(previousSelection, category, key);
    setSelection(nextSelection);
    setSaving(true);
    setError("");
    try {
      setAccount(await updateMyAccount(user, { interests: nextSelection }));
    } catch (caught) {
      setSelection(previousSelection);
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return { selection, saving, error, toggle };
}
