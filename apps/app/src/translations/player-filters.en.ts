// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

export const playerFilterCopy = {
  title: "Filter Players",
  position: "Position",
  interestedIn: "Interested In",
  apply: "Apply",
  close: "Close player filters",
  sortTitle: "Sort players",
  closeSort: "Close player sorting",
  recommended: "Recommended",
  nameAscending: "Name A–Z",
  sortHint: "Recommended puts shared profile interests first, then sorts by name.",
  clearFilters: "Clear filters",
  noMatchesDetail: "Try another name or remove a filter.",
  removeFilter: (label: string) => `Remove ${label} filter`,
  activeFilters: (count: number) => `${count} active filter${count === 1 ? "" : "s"}`,
  matchingPlayers: (count: number) => `${count} matching player${count === 1 ? "" : "s"}`,
  interests: {
    beach: "Beach",
    indoors: "Indoors",
    nines: "9s",
    sixes: "6s",
    fours: "4s",
    twos: "2s",
    mixed: "Co-ed",
  },
};
