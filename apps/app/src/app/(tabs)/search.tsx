// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerDirectory } from "@/components/playerDirectory";
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
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [tournamentsError, setTournamentsError] = useState<string>();
  const [tournamentFilters, setTournamentFilters] = useState<TournamentFilters>({
    ...EMPTY_TOURNAMENT_FILTERS,
  });
  const [draftTournamentFilters, setDraftTournamentFilters] = useState<TournamentFilters>({
    ...EMPTY_TOURNAMENT_FILTERS,
  });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const { user } = useSession();

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

  useEffect(() => {
    if (tab !== "tournaments") return;

    let isCurrent = true;
    // Reset stale results when a retry request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournaments([]);
    setTournamentsError(undefined);
    setTournamentsLoading(true);

    getTournaments()
      .then((result) => {
        if (isCurrent) setTournaments(result);
      })
      .catch((error) => {
        if (isCurrent) setTournamentsError(apiErrorMessage(error));
      })
      .finally(() => {
        if (isCurrent) setTournamentsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [tab, retryAttempt]);

  const activeFilterCount = getActiveTournamentFilterCount(tournamentFilters);
  const draftResultCount = filterTournaments(tournaments, query, draftTournamentFilters).length;
  const selectTab = (nextTab: SearchTab) => {
    lastSelectedTab = nextTab;
    setTab(nextTab);
  };
  const openFilters = () => {
    setDraftTournamentFilters({
      ...tournamentFilters,
      formats: [...tournamentFilters.formats],
      levels: [...tournamentFilters.levels],
      surfaces: [...tournamentFilters.surfaces],
      teamSizes: [...tournamentFilters.teamSizes],
    });
    setFilterSheetVisible(true);
  };
  const clearFilters = () =>
    setTournamentFilters({
      ...EMPTY_TOURNAMENT_FILTERS,
      formats: [],
      levels: [],
      surfaces: [],
      teamSizes: [],
    });
  const clearDraftFilters = () =>
    setDraftTournamentFilters({
      ...EMPTY_TOURNAMENT_FILTERS,
      formats: [],
      levels: [],
      surfaces: [],
      teamSizes: [],
    });

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
            onPressFilter={tab === "tournaments" ? openFilters : undefined}
            activeFilterCount={tab === "tournaments" ? activeFilterCount : 0}
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
            loading={tournamentsLoading}
            error={tournamentsError}
            retry={() => setRetryAttempt((attempt) => attempt + 1)}
            fonts={fonts}
            clearSearch={() => setQuery("")}
            clearFilters={clearFilters}
            removeFilter={(update) => setTournamentFilters(update)}
            onRegister={() => Alert.alert(copy.register, copy.registrationUnavailable)}
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
          />
        )}
      </ScrollView>
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
