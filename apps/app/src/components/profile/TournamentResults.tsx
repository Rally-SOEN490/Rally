// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { apiErrorMessage } from "@/lib/api";
import { getTournamentResults, type TournamentResult } from "@/lib/profile-tournaments";
import { profileCopy as copy } from "@/locales/en/profile";
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" });
export function TournamentResults({ user }: { user: User }) {
  const [entries, setEntries] = useState<TournamentResult[]>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let current = true;
    getTournamentResults(user).then(({ results }) => { if (current) setEntries(results); })
      .catch((reason) => { if (current) setError(apiErrorMessage(reason)); });
    return () => { current = false; };
  }, [user, attempt]);
  return <View style={styles.section}>
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.title}>{copy.results}</Text>
      {!!entries && entries.length > 3 && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} hitSlop={8}>
        <Text style={styles.link}>{expanded ? copy.seeLess : copy.seeAll}</Text>
      </Pressable>}
    </View>
    {entries === undefined && !error && <ActivityIndicator accessibilityLabel={copy.loadingResults} color="#204d42" />}
    {!!error && <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => { setError(""); setAttempt(attempt + 1); }} style={styles.retry}><Text style={styles.link}>{copy.retry}</Text></Pressable></View>}
    {entries?.length === 0 && <View style={styles.empty}><Text style={styles.body}>{copy.noResults}</Text></View>}
    <View style={styles.list}>
      {(expanded ? entries : entries?.slice(0, 3))?.map((entry) => <View key={entry.id} style={styles.result}>
        <View style={[styles.medal, { backgroundColor: entry.placement === 1 ? "#f3e5c9" : entry.placement === 2 ? "#e0e6e5" : entry.placement === 3 ? "#f7d7b4" : "#d9e8dc" }]}>
          <Text accessibilityLabel={`${copy.placement} ${entry.placement}`} style={styles.place}>#{entry.placement}</Text>
        </View>
        <View style={styles.info}><Text style={styles.name}>{entry.tournamentName}</Text><Text style={styles.body}>{entry.eventName}</Text><Text style={styles.body}>{entry.teamName}</Text></View>
        <Text style={styles.date}>{date(entry.endedAt)}</Text>
      </View>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  section: { marginTop: 24 }, heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#12382d" }, link: { fontSize: 14, color: "#204d42", fontWeight: "600" },
  empty: { padding: 16, backgroundColor: "#f2f0ed", borderRadius: 12, borderWidth: 1, borderColor: "#d9d5d0" }, body: { color: "#536761", fontSize: 12, lineHeight: 18 },
  list: { gap: 10 }, result: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, backgroundColor: "#f2f0ed", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#d9d5d0" },
  medal: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, place: { color: "#12382d", fontWeight: "800" }, info: { flex: 1 },
  name: { color: "#12382d", fontSize: 15, fontWeight: "700" }, date: { color: "#536761", fontSize: 11 }, error: { color: "#9b2929", fontSize: 14 }, retry: { minHeight: 44, justifyContent: "center" },
});
