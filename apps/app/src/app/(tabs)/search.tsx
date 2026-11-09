// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerDirectory } from "@/components/playerDirectory";
import { PlayerFilterBar } from "@/components/playerFilterBar";
import { PlayerFiltersSheet } from "@/components/playerFilters";
import { usePlayerFilters } from "@/hooks/usePlayerFilters";
import { TournamentDirectory } from "@/components/tournamentDirectory";
import { TournamentFiltersSheet } from "@/components/tournamentFilters";
import { useSearchFonts } from "@/lib/search-fonts";
import { searchCopy as copy } from "@/translations/search.en";

import { SearchBanner } from "@/components/searchBanner";
import { SearchBar } from "@/components/searchBar";
import { SegmentedToggle } from "@/components/searchToggle";
import { colors } from "@/constants/rallyTheme";
import { apiErrorMessage, getPlayers, type RallyPlayer } from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  copyTournamentFilters,
  EMPTY_TOURNAMENT_FILTERS,
  filterTournaments,
  getActiveTournamentFilterCount,
  getTournaments,
  type Tournament,
  type TournamentFilters,
} from "@/lib/tournaments";

const TABS = [
  { value: "tournaments", label: copy.tabs.tournaments },
  { value: "players", label: copy.tabs.players },
] as const;

type SearchTab = (typeof TABS)[number]["value"];

let lastSelectedTab: SearchTab = "tournaments";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const fonts = useSearchFonts();
  const [tab, setTab] = useState<SearchTab>(lastSelectedTab);
  const [players, setPlayers] = useState<RallyPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState<string>();
  const { user, account } = useSession();
  const playerFilters = usePlayerFilters();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [tournamentsError, setTournamentsError] = useState<string>();
  const [tournamentFilters, setTournamentFilters] = useState<TournamentFilters>(() =>
    copyTournamentFilters(EMPTY_TOURNAMENT_FILTERS),
  );
  const [draftTournamentFilters, setDraftTournamentFilters] = useState<TournamentFilters>(() =>
    copyTournamentFilters(EMPTY_TOURNAMENT_FILTERS),
  );
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState<string>();

  useEffect(() => {
    if (tab !== "players" || !user) return;

    let isCurrent = true;
    // Reset stale results when the signed-in user, tab, or retry request changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayers([]);
    setPlayersError(undefined);
    setPlayersLoading(true);

    getPlayers(user)
      .then((result) => {
        if (isCurrent) setPlayers(result);
      })
      .catch((error) => {
        if (isCurrent) setPlayersError(apiErrorMessage(error));
      })
      .finally(() => {
        if (isCurrent) setPlayersLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [tab, user, retryAttempt]);

  // Loads tournaments each time Search comes back into view, not just once:
  // the tabs keep this screen loaded, so without this a tournament published
  // from Events a moment ago wouldn't be listed. Results already on screen stay
  // while the new ones load.
  const loadTournaments = useCallback(() => {
    if (tab !== "tournaments" || !user) return;

    let isCurrent = true;
    setTournamentsError(undefined);
    setTournamentsLoading(true);

    getTournaments(user)
      .then((result) => {
        if (isCurrent) setTournaments(result);
      })
      .catch((error) => {
        if (isCurrent) setTournamentsError(apiErrorMessage(error));
      })
      .finally(() => {
        if (isCurrent) setTournamentsLoading(false);
      });

    // Leaving Search ignores an answer that arrives afterwards.
    return () => {
      isCurrent = false;
    };
  }, [tab, user]);
  useFocusEffect(loadTournaments);

  const activeFilterCount = getActiveTournamentFilterCount(tournamentFilters);
  const draftResultCount = filterTournaments(tournaments, query, draftTournamentFilters).length;
  const selectTab = (nextTab: SearchTab) => {
    lastSelectedTab = nextTab;
    setTab(nextTab);
  };
  const openFilters = () => {
    setDraftTournamentFilters(copyTournamentFilters(tournamentFilters));
    setFilterSheetVisible(true);
  };
  const clearFilters = () => setTournamentFilters(copyTournamentFilters(EMPTY_TOURNAMENT_FILTERS));
  const clearDraftFilters = () =>
    setDraftTournamentFilters(copyTournamentFilters(EMPTY_TOURNAMENT_FILTERS));
  const handleRegister = () => {
    if (Platform.OS === "web") {
      setRegistrationNotice(copy.registrationUnavailable);
      return;
    }

    Alert.alert(copy.register, copy.registrationUnavailable);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SearchBanner
          fontFamily={fonts.semibold}
          regularFontFamily={fonts.regular}
          mediumFontFamily={fonts.medium}
        />

        <View style={styles.controls}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            mode={tab}
            fontFamily={fonts.regular}
            onPressFilter={tab === "players" ? playerFilters.open : openFilters}
            activeFilterCount={tab === "players" ? playerFilters.count : activeFilterCount}
          />
          <SegmentedToggle
            options={TABS}
            selected={tab}
            onChange={selectTab}
            fontFamily={fonts.semibold}
          />
        </View>

        {tab === "tournaments" && (
          <TournamentDirectory
            tournaments={tournaments}
            query={query}
            filters={tournamentFilters}
            // The spinner only replaces an empty list; a refresh keeps the results.
            loading={tournamentsLoading && tournaments.length === 0}
            error={tournamentsError}
            retry={loadTournaments}
            fonts={fonts}
            clearSearch={() => setQuery("")}
            clearFilters={clearFilters}
            removeFilter={(update) => setTournamentFilters(update)}
            registrationNotice={registrationNotice}
            onRegister={handleRegister}
          />
        )}

        {tab === "players" && (
          <PlayerFilterBar
            filters={playerFilters.filters}
            sort={playerFilters.sort}
            fonts={fonts}
            onRemove={playerFilters.remove}
            onSort={playerFilters.setSort}
          />
        )}
        {tab === "players" && (
          <PlayerDirectory
            players={players}
            query={query}
            loading={playersLoading}
            error={playersError}
            retry={() => setRetryAttempt((attempt) => attempt + 1)}
            clearSearch={() => setQuery("")}
            fonts={fonts}
            filters={playerFilters.filters}
            sort={playerFilters.sort}
            clearFilters={playerFilters.clear}
            viewerInterests={account?.interests}
          />
        )}
      </ScrollView>
      <PlayerFiltersSheet
        visible={tab === "players" && playerFilters.visible}
        filters={playerFilters.draft}
        onChange={playerFilters.setDraft}
        onClose={playerFilters.close}
        onApply={playerFilters.apply}
        fonts={fonts}
      />
      <TournamentFiltersSheet
        visible={filterSheetVisible}
        filters={draftTournamentFilters}
        resultCount={draftResultCount}
        onClose={() => setFilterSheetVisible(false)}
        onChange={setDraftTournamentFilters}
        onApply={() => {
          setTournamentFilters(draftTournamentFilters);
          setFilterSheetVisible(false);
        }}
        onClear={clearDraftFilters}
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
