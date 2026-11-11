// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import {
  copyTournamentFilters,
  EMPTY_TOURNAMENT_FILTERS,
  getActiveTournamentFilterCount,
  type TournamentFilters,
} from "@/lib/tournaments";

const emptyFilters = () => copyTournamentFilters(EMPTY_TOURNAMENT_FILTERS);

// The filters applied to the tournament list, plus a draft copy that the
// filter sheet edits until the person presses Apply.
export function useTournamentFilterState() {
  const [applied, setApplied] = useState<TournamentFilters>(emptyFilters);
  const [draft, setDraft] = useState<TournamentFilters>(emptyFilters);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = () => {
    setDraft(copyTournamentFilters(applied));
    setSheetVisible(true);
  };

  const applyDraft = () => {
    setApplied(draft);
    setSheetVisible(false);
  };

  return {
    applied,
    setApplied,
    draft,
    setDraft,
    activeCount: getActiveTournamentFilterCount(applied),
    sheetVisible,
    openSheet,
    closeSheet: () => setSheetVisible(false),
    applyDraft,
    clearApplied: () => setApplied(emptyFilters()),
    clearDraft: () => setDraft(emptyFilters()),
  };
}
