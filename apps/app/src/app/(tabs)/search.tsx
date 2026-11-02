// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerDirectory } from "@/components/playerDirectory";
import { PlayerFilterBar } from "@/components/playerFilterBar";
import { PlayerFiltersSheet } from "@/components/playerFilters";
import { usePlayerFilters } from "@/hooks/usePlayerFilters";
import { useSearchFonts } from "@/lib/search-fonts";
import { searchCopy as copy } from "@/translations/search.en";

import { SearchBanner } from "@/components/searchBanner";
import { SearchBar } from "@/components/searchBar";
import { SegmentedToggle } from "@/components/searchToggle";
import { colors } from "@/constants/rallyTheme";
import { apiErrorMessage, getPlayers, type RallyPlayer } from "@/lib/api";
import { useSession } from "@/lib/session";

const TABS = [
  { value: "tournaments", label: copy.tabs.tournaments },
  { value: "players", label: copy.tabs.players },
] as const;

const MOCK_TOURNAMENTS = [
  { id: "montreal-spring-open", name: "Montreal Spring Open" },
  { id: "concordia-fall-classic", name: "Concordia Fall Classic" },
  { id: "laval-beach-invitational", name: "Laval Beach Invitational" },
];

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

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleTournaments = MOCK_TOURNAMENTS.filter((tournament) =>
    tournament.name.toLocaleLowerCase().includes(normalizedQuery),
  );
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

        <View style={styles.controls}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            mode={tab}
            fontFamily={fonts.regular}
            onPressFilter={tab === "players" ? playerFilters.open : undefined}
            activeFilterCount={tab === "players" ? playerFilters.count : 0}
          />
          <SegmentedToggle
            options={TABS}
            selected={tab}
            onChange={selectTab}
            fontFamily={fonts.semibold}
          />
        </View>

        {tab === "tournaments" && (
          <View>
            {visibleTournaments.length > 0 ? (
              visibleTournaments.map((tournament) => (
                <Text key={tournament.id}>{tournament.name}</Text>
              ))
            ) : (
              <Text>{copy.noTournaments}</Text>
            )}
          </View>
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
