// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { clonePlayerFilters, emptyPlayerFilters, playerFilterCount } from "@/lib/player-filters";
import type { PlayerFilters, PlayerSort } from "@/lib/player-filters";

export function usePlayerFilters() {
  const [filters, setFilters] = useState(emptyPlayerFilters);
  const [draft, setDraft] = useState(emptyPlayerFilters);
  const [visible, setVisible] = useState(false);
  const [sort, setSort] = useState<PlayerSort>("recommended");
  return {
    filters,
    draft,
    setDraft,
    visible,
    sort,
    setSort,
    count: playerFilterCount(filters),
    open: () => {
      setDraft(clonePlayerFilters(filters));
      setVisible(true);
    },
    close: () => setVisible(false),
    clear: () => setFilters(emptyPlayerFilters()),
    apply: () => {
      setFilters(clonePlayerFilters(draft));
      setVisible(false);
    },
    remove: (group: keyof PlayerFilters, value: string) =>
      setFilters((current) => ({
        ...current,
        [group]: current[group].filter((key) => key !== value),
      })),
  };
}
