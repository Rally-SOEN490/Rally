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
  registrationNotice?: string;
  onRegister: (tournament: Tournament) => void;
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
  registrationNotice,
  onRegister,
}: Props) {
  const visible = filterTournaments(tournaments, query, filters);
  const hasAppliedFilters = getActiveTournamentFilterCount(filters) > 0;

  if (loading) return <Message title={copy.loadingTournaments} loading />;
  if (error) return <Message title={error} action={copy.retry} onAction={retry} />;
  if (tournaments.length === 0) return <Message title={copy.emptyTournaments} />;

  return (
    <View style={styles.container}>
      {hasAppliedFilters && (
        <View style={styles.chipsHeader}>
          <View style={styles.chips}>
            {filters.dateRange && (
              <FilterChip
                label={copy.dateRangeLabel(filters.dateRange)}
                onRemove={() => removeFilter((current) => ({ ...current, dateRange: undefined }))}
              />
            )}
            {filters.formats.map((value) => (
              <FilterChip
                key={`format-${value}`}
                label={value}
                onRemove={() =>
                  removeFilter((current) => ({
                    ...current,
                    formats: current.formats.filter((item) => item !== value),
                  }))
                }
              />
            ))}
            {filters.levels.map((value) => (
              <FilterChip
                key={`level-${value}`}
                label={value}
                onRemove={() =>
                  removeFilter((current) => ({
                    ...current,
                    levels: current.levels.filter((item) => item !== value),
                  }))
                }
              />
            ))}
            {filters.surfaces.map((value) => (
              <FilterChip
                key={`surface-${value}`}
                label={value}
                onRemove={() =>
                  removeFilter((current) => ({
                    ...current,
                    surfaces: current.surfaces.filter((item) => item !== value),
                  }))
                }
              />
            ))}
            {filters.teamSizes.map((value) => (
              <FilterChip
                key={`team-${value}`}
                label={copy.teamSize(value)}
                onRemove={() =>
                  removeFilter((current) => ({
                    ...current,
                    teamSizes: current.teamSizes.filter((item) => item !== value),
                  }))
                }
              />
            ))}
            {filters.priceRange && (
              <FilterChip
                label={copy.priceRangeLabel(filters.priceRange)}
                onRemove={() => removeFilter((current) => ({ ...current, priceRange: undefined }))}
              />
            )}
            {filters.spotsAvailable && (
              <FilterChip
                label={copy.filterSpots}
                onRemove={() => removeFilter((current) => ({ ...current, spotsAvailable: false }))}
              />
            )}
          </View>
          <Pressable accessibilityRole="button" onPress={clearFilters}>
            <Text style={styles.clearAll}>{copy.clearAll}</Text>
          </Pressable>
        </View>
      )}
      {registrationNotice && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>
          {registrationNotice}
        </Text>
      )}
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
              onRegister={onRegister}
            />
          ))}
        </View>
      ) : (
        <Message
          title={copy.noTournamentMatches}
          action={!hasAppliedFilters && query.trim() ? copy.clearSearch : undefined}
          onAction={clearSearch}
        />
      )}
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
  notice: {
    color: colors.forest,
    backgroundColor: "#E8EEDC",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
  },
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
