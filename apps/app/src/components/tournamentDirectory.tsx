// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/rallyTheme";
import type { SearchFonts } from "@/lib/search-fonts";
import {
  filterTournaments,
  getActiveTournamentFilterCount,
  type Tournament,
  type TournamentFilters,
} from "@/lib/tournaments";
import { searchCopy as copy } from "@/translations/search.en";
import { tournamentCopy } from "@/translations/tournaments.en";
import { TournamentCard } from "@/components/tournamentCard";

type Props = {
  tournaments: Tournament[];
  query: string;
  filters: TournamentFilters;
  loading: boolean;
  error?: string;
  retry: () => void;
  fonts: SearchFonts;
  clearSearch: () => void;
  clearFilters: () => void;
  removeFilter: (update: (filters: TournamentFilters) => TournamentFilters) => void;
  onOpen: (tournament: Tournament) => void;
};

function Message({
  title,
  action,
  onAction,
  loading,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.message} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator color={colors.forest} />}
      <Text style={styles.messageTitle}>{title}</Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.retry}>
          <Text style={styles.retryText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

type Chip = {
  key: string;
  label: string;
  remove: (filters: TournamentFilters) => TournamentFilters;
};

// Chips for the filters that can hold several values: formats, levels and types.
const listFilterChips = (filters: TournamentFilters): Chip[] => [
  ...filters.formats.map((value) => ({
    key: `format-${value}`,
    label: value,
    remove: (current: TournamentFilters) => ({
      ...current,
      formats: current.formats.filter((item) => item !== value),
    }),
  })),
  ...filters.levels.map((value) => ({
    key: `level-${value}`,
    label: value,
    remove: (current: TournamentFilters) => ({
      ...current,
      levels: current.levels.filter((item) => item !== value),
    }),
  })),
  ...filters.types.map((value) => ({
    key: `type-${value}`,
    label: tournamentCopy.divisions.types[value],
    remove: (current: TournamentFilters) => ({
      ...current,
      types: current.types.filter((item) => item !== value),
    }),
  })),
];

// One removable chip per applied filter, in the order the filter sheet shows them.
const filterChips = (filters: TournamentFilters): Chip[] => [
  ...(filters.dateRange
    ? [
        {
          key: "dateRange",
          label: copy.dateRangeLabel(filters.dateRange),
          remove: (current: TournamentFilters) => ({ ...current, dateRange: undefined }),
        },
      ]
    : []),
  ...listFilterChips(filters),
  ...(filters.priceRange
    ? [
        {
          key: "priceRange",
          label: copy.priceRangeLabel(filters.priceRange),
          remove: (current: TournamentFilters) => ({ ...current, priceRange: undefined }),
        },
      ]
    : []),
  ...(filters.spotsAvailable
    ? [
        {
          key: "spotsAvailable",
          label: copy.filterSpots,
          remove: (current: TournamentFilters) => ({ ...current, spotsAvailable: false }),
        },
      ]
    : []),
];

function ActiveFilterChips({
  filters,
  removeFilter,
  clearFilters,
}: Pick<Props, "filters" | "removeFilter" | "clearFilters">) {
  return (
    <View style={styles.chipsHeader}>
      <View style={styles.chips}>
        {filterChips(filters).map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            onRemove={() => removeFilter(chip.remove)}
          />
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={clearFilters}>
        <Text style={styles.clearAll}>{copy.clearAll}</Text>
      </Pressable>
    </View>
  );
}

// How many tournaments match, then the cards, or a message when none match.
function TournamentResults({
  visible,
  fonts,
  onOpen,
  noMatchAction,
}: {
  visible: Tournament[];
  fonts: SearchFonts;
  onOpen: (tournament: Tournament) => void;
  // Offered as "Clear search" when nothing matches the typed search.
  noMatchAction?: () => void;
}) {
  return (
    <>
      <Text style={[styles.resultCount, { fontFamily: fonts.regular }]}>
        {copy.resultCount(visible.length)}
      </Text>
      {visible.length > 0 ? (
        <View style={styles.list}>
          {visible.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              fonts={fonts}
              onOpen={onOpen}
            />
          ))}
        </View>
      ) : (
        <Message
          title={copy.noTournamentMatches}
          action={noMatchAction ? copy.clearSearch : undefined}
          onAction={noMatchAction}
        />
      )}
    </>
  );
}

export function TournamentDirectory({
  tournaments,
  query,
  filters,
  loading,
  error,
  retry,
  fonts,
  clearSearch,
  clearFilters,
  removeFilter,
  onOpen,
}: Props) {
  const visible = filterTournaments(tournaments, query, filters);
  const hasAppliedFilters = getActiveTournamentFilterCount(filters) > 0;

  if (loading) return <Message title={copy.loadingTournaments} loading />;
  if (error) return <Message title={error} action={copy.retry} onAction={retry} />;
  if (tournaments.length === 0) return <Message title={copy.emptyTournaments} />;

  return (
    <View style={styles.container}>
      {hasAppliedFilters && (
        <ActiveFilterChips
          filters={filters}
          removeFilter={removeFilter}
          clearFilters={clearFilters}
        />
      )}
      <TournamentResults
        visible={visible}
        fonts={fonts}
        onOpen={onOpen}
        noMatchAction={!hasAppliedFilters && query.trim() ? clearSearch : undefined}
      />
    </View>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.removeFilter(label)}
      onPress={onRemove}
      style={styles.chip}
    >
      <Text style={styles.chipText}>{label} ×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  list: { gap: 10 },
  chipsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  chips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: "#E1E9D4",
    justifyContent: "center",
  },
  chipText: { color: colors.forest, fontSize: 11 },
  clearAll: { color: colors.forest, fontSize: 12, fontWeight: "600", paddingTop: 6 },
  resultCount: { color: colors.textMuted, fontSize: 12 },
  message: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 12,
  },
  messageTitle: { color: colors.forest, fontSize: 15, fontWeight: "600", textAlign: "center" },
  retry: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.forest,
    justifyContent: "center",
  },
  retryText: { color: colors.white, fontSize: 13, fontWeight: "600" },
});
