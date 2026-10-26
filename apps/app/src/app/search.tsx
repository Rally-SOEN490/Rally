/*
AI declaration:
50% or more AI-generated
*/
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchBanner } from "@/components/searchBanner";
import { SearchBar } from "@/components/searchBar";
import { SegmentedToggle } from "@/components/searchToggle";
import { colors } from "@/constants/rallyTheme";
import { apiErrorMessage, getPlayers, type RallyPlayer } from "@/lib/api";
import { useSession } from "@/lib/session";

const navItems: { label: string; active: boolean; action?: Href }[] = [
  { label: "Home", active: false, action: "/home" },
  { label: "Events", active: false },
  { label: "Search", active: true },
  { label: "Notifications", active: false },
  { label: "You", active: false, action: "/profile" },
];

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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

      <View style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = item.active;
          return (
            <Pressable
              key={item.label}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => {
                if (item.action) router.replace(item.action);
              }}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                {item.label === "Home" ? "⌂" : item.label === "Events" ? "◫" : item.label === "Search" ? "⌕" : item.label === "Notifications" ? "◔" : "◉"}
              </Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
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
  navBar: {
    position: "absolute",
    bottom: 14,
    left: 20,
    right: 20,
    backgroundColor: "#f2f0ed",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navItem: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 16 },
  navItemActive: { backgroundColor: "#dfe9e4" },
  navIcon: { fontSize: 18, color: "#4d5d58" },
  navIconActive: { color: "#12382d" },
  navLabel: { fontSize: 10, marginTop: 4, color: "#4d5d58", fontWeight: "600" },
  navLabelActive: { color: "#12382d" },
});