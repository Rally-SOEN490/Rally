// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchBanner } from "@/components/searchBanner";
import { SearchBar } from "@/components/searchBar";
import { SegmentedToggle } from "@/components/searchToggle";
import { colors } from "@/constants/rallyTheme";
import { apiErrorMessage, getPlayers, type RallyPlayer } from "@/lib/api";
import { useSession } from "@/lib/session";

const TABS = [
  { value: "tournaments", label: "Tournaments" },
  { value: "players", label: "Players" },
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
  const [tab, setTab] = useState<SearchTab>(lastSelectedTab);
  const [players, setPlayers] = useState<RallyPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState<string>();
  const { user } = useSession();

  useEffect(() => {
    if (tab !== "players" || !user) return;

    let isCurrent = true;
    // Reset the prior user's/tab's results as this cancellable request starts.
    // Keep this existing loading lifecycle here rather than refactor search in a CI change.
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
  }, [tab, user]);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleTournaments = MOCK_TOURNAMENTS.filter((tournament) =>
    tournament.name.toLocaleLowerCase().includes(normalizedQuery),
  );
  const visiblePlayers = players.filter((player) =>
    player.displayName.toLocaleLowerCase().includes(normalizedQuery),
  );
  const selectTab = (nextTab: SearchTab) => {
    lastSelectedTab = nextTab;
    setTab(nextTab);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SearchBanner />

        <View style={styles.controls}>
          <SearchBar value={query} onChangeText={setQuery} mode={tab} />
          <SegmentedToggle options={TABS} selected={tab} onChange={selectTab} />
        </View>

        {tab === "tournaments" && (
          <View>
            {visibleTournaments.length > 0 ? (
              visibleTournaments.map((tournament) => (
                <Text key={tournament.id}>{tournament.name}</Text>
              ))
            ) : (
              <Text>No matching tournaments.</Text>
            )}
          </View>
        )}

        {tab === "players" && (
          <View>
            {playersLoading ? (
              <Text>Loading players...</Text>
            ) : playersError ? (
              <Text>{playersError}</Text>
            ) : visiblePlayers.length > 0 ? (
              visiblePlayers.map((player) => <Text key={player.id}>{player.displayName}</Text>)
            ) : (
              <Text>{players.length === 0 ? "No players found." : "No matching players."}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 16,
    paddingBottom: 120, // room for the floating nav bar
    gap: 16,
  },
  controls: { gap: 16 },
});
