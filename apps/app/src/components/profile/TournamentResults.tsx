// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { ProfileIcon } from "./ProfileIcon";
import { ProfileStripes } from "./ProfileStripes";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { apiErrorMessage } from "@/lib/api";
import { getTournamentResults, type TournamentResult } from "@/lib/profile-tournaments";
import { profileCopy as copy } from "@/locales/en/profile";
const podiumColors: Record<number, { background: string; border: string }> = {
  1: { background: "#f8df77", border: "#d7b44a" },
  2: { background: "#e2e7df", border: "#aebbb5" },
  3: { background: "#efc196", border: "#bb8c60" },
};
const ordinaryColors = { background: "#fff", border: "transparent" };
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
      {!!entries && entries.length > 3 && <Pressable accessibilityRole="button" accessibilityLabel={expanded ? copy.seeLess : copy.seeAll} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} hitSlop={8}>
        <Text style={styles.link}>{expanded ? copy.seeLessShort : copy.seeAllShort}</Text>
      </Pressable>}
    </View>
    {entries === undefined && !error && <ActivityIndicator accessibilityLabel={copy.loadingResults} color="#204d42" />}
    {!!error && <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => { setError(""); setAttempt(attempt + 1); }} style={styles.retry}><Text style={styles.link}>{copy.retry}</Text></Pressable></View>}
    {entries?.length === 0 && <View style={styles.empty}><Text style={styles.body}>{copy.noResults}</Text></View>}
    <View style={styles.list}>
      {(expanded ? entries : entries?.slice(0, 3))?.map((entry) => {
        const podium = entry.placement <= 3;
        const colors = podiumColors[entry.placement] ?? ordinaryColors;
        return <View key={entry.id} style={[styles.result, { backgroundColor: colors.background }]}>
          {podium && <ProfileStripes color="rgba(255,255,255,0.3)" />}
          <View style={[styles.medal, podium && styles.podiumMedal, { borderColor: colors.border }]}>
            {podium && <ProfileIcon name="star" size={12} color="#7a6740" />}
            <Text accessibilityLabel={`${copy.placement} ${entry.placement}`} style={styles.place}>#{entry.placement}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{entry.tournamentName}</Text>
            <Text style={styles.body}>{entry.eventName}</Text>
            <Text style={styles.team}>{entry.teamName}</Text>
          </View>
          <Text style={styles.date}>{date(entry.endedAt)}</Text>
        </View>;
      })}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  section: { marginTop: 18 },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: "700", color: "#172e25" },
  link: { fontSize: 10, color: "#718378" },
  empty: { padding: 12, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e4e9df" },
  body: { color: "#526448", fontSize: 9, lineHeight: 12 },
  team: { color: "#526448", fontSize: 9, lineHeight: 12 },
  list: { borderRadius: 12, overflow: "hidden" },
  result: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 58, paddingVertical: 8, paddingHorizontal: 12, overflow: "hidden", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.7)" },
  medal: { width: 30, height: 34, alignItems: "center", justifyContent: "center" },
  podiumMedal: { borderRadius: 17, borderWidth: 2, backgroundColor: "rgba(255,255,255,0.42)", boxShadow: "0px 2px 5px rgba(53,60,40,0.16)" },
  place: { color: "#314833", fontSize: 10, fontWeight: "700" },
  info: { flex: 1 }, name: { color: "#263b2d", fontSize: 12, fontWeight: "700", lineHeight: 15 },
  date: { color: "#586a53", fontSize: 10 },
  error: { color: "#9b2929", fontSize: 13 }, retry: { minHeight: 44, justifyContent: "center" },
});
