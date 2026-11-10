// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerDirectory } from "@/components/playerDirectory";
import { SearchBanner } from "@/components/searchBanner";
import { SearchBar } from "@/components/searchBar";
import { usePlayerResults } from "@/components/search/usePlayerResults";
import { useTournamentFilterState } from "@/components/search/useTournamentFilterState";
import { useTournamentResults } from "@/components/search/useTournamentResults";
import { SegmentedToggle } from "@/components/searchToggle";
import { TournamentDirectory } from "@/components/tournamentDirectory";
import { TournamentFiltersSheet } from "@/components/tournamentFilters";
import { colors } from "@/constants/rallyTheme";
import { tournamentPaths } from "@/lib/organizer-tournaments";
import { useSearchFonts } from "@/lib/search-fonts";
import { useSession } from "@/lib/session";
import { filterTournaments, type Tournament } from "@/lib/tournaments";
import { searchCopy as copy } from "@/translations/search.en";

const TABS = [
  { value: "tournaments", label: copy.tabs.tournaments },
  { value: "players", label: copy.tabs.players },
] as const;

type SearchTab = (typeof TABS)[number]["value"];

let lastSelectedTab: SearchTab = "tournaments";

const openTournament = (tournament: Tournament) => router.push(tournamentPaths.page(tournament.id));

// The search field (with the filter button on the Tournaments tab) and the tabs.
function SearchControls({
  tab,
  onSelectTab,
  query,
  onChangeQuery,
  fonts,
  filters,
}: {
  tab: SearchTab;
  onSelectTab: (tab: SearchTab) => void;
  query: string;
  onChangeQuery: (query: string) => void;
  fonts: ReturnType<typeof useSearchFonts>;
  filters: ReturnType<typeof useTournamentFilterState>;
}) {
  return (
    <View style={styles.controls}>
      <SearchBar
        value={query}
        onChangeText={onChangeQuery}
        mode={tab}
        fontFamily={fonts.regular}
        onPressFilter={tab === "tournaments" ? filters.openSheet : undefined}
        activeFilterCount={tab === "tournaments" ? filters.activeCount : 0}
      />
      <SegmentedToggle
        options={TABS}
        selected={tab}
        onChange={onSelectTab}
        fontFamily={fonts.semibold}
      />
    </View>
  );
}

// The tournament or player list, depending on the tab.
function SearchResults({
  tab,
  query,
  clearSearch,
  fonts,
  players,
  tournaments,
  filters,
}: {
  tab: SearchTab;
  query: string;
  clearSearch: () => void;
  fonts: ReturnType<typeof useSearchFonts>;
  players: ReturnType<typeof usePlayerResults>;
  tournaments: ReturnType<typeof useTournamentResults>;
  filters: ReturnType<typeof useTournamentFilterState>;
}) {
  return (
    <>
      {tab === "tournaments" && (
        <TournamentDirectory
          tournaments={tournaments.tournaments}
          query={query}
          filters={filters.applied}
          // The spinner only replaces an empty list; a refresh keeps the results.
          loading={tournaments.loading && tournaments.tournaments.length === 0}
          error={tournaments.error}
          retry={tournaments.retry}
          fonts={fonts}
          clearSearch={clearSearch}
          clearFilters={filters.clearApplied}
          removeFilter={(update) => filters.setApplied(update)}
          onOpen={openTournament}
        />
      )}

      {tab === "players" && (
        <PlayerDirectory
          players={players.players}
          query={query}
          loading={players.loading}
          error={players.error}
          retry={players.retry}
          clearSearch={clearSearch}
          fonts={fonts}
        />
      )}
    </>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const fonts = useSearchFonts();
  const [tab, setTab] = useState<SearchTab>(lastSelectedTab);
  const { user } = useSession();
  const players = usePlayerResults(tab === "players", user);
  const tournaments = useTournamentResults(tab === "tournaments", user);
  const filters = useTournamentFilterState();

  const selectTab = (nextTab: SearchTab) => {
    lastSelectedTab = nextTab;
    setTab(nextTab);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SearchBanner
          fontFamily={fonts.semibold}
          regularFontFamily={fonts.regular}
          mediumFontFamily={fonts.medium}
        />

        <SearchControls
          tab={tab}
          onSelectTab={selectTab}
          query={query}
          onChangeQuery={setQuery}
          fonts={fonts}
          filters={filters}
        />

        <SearchResults
          tab={tab}
          query={query}
          clearSearch={() => setQuery("")}
          fonts={fonts}
          players={players}
          tournaments={tournaments}
          filters={filters}
        />
      </ScrollView>
      <TournamentFiltersSheet
        visible={filters.sheetVisible}
        filters={filters.draft}
        resultCount={filterTournaments(tournaments.tournaments, query, filters.draft).length}
        onClose={filters.closeSheet}
        onChange={filters.setDraft}
        onApply={filters.applyDraft}
        onClear={filters.clearDraft}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 17,
    width: "100%",
    maxWidth: 442,
    alignSelf: "center",
    paddingBottom: 120, // room for the floating nav bar
    gap: 16,
  },
  controls: { gap: 4 },
});
