// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet, Text, View } from "react-native";

// Placeholder team and statistics until teams and results exist.
const stats = [
  { label: "Matches", value: "132" },
  { label: "Wins", value: "90" },
  { label: "Top 4", value: "11" },
  { label: "Events", value: "9" },
];

// The player's team and their headline statistics.
export function TeamSummary() {
  return (
    <>
      <View style={styles.teamBanner}>
        <View style={styles.teamBadge}>
          <Text style={styles.teamEmoji}>🌿</Text>
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>Sunbirds</Text>
          <Text style={styles.teamMeta}>Co-ed 6s • Captain</Text>
        </View>
        <View style={styles.teamTag}>
          <Text style={styles.teamTagText}>Rank</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  teamBanner: {
    backgroundColor: "#12382d",
    borderRadius: 20,
    padding: 14,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  teamBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#dfe9e4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  teamEmoji: {
    fontSize: 20,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f5f3ef",
  },
  teamMeta: {
    fontSize: 12,
    color: "#d9dfd7",
    marginTop: 4,
  },
  teamTag: {
    backgroundColor: "#f3f6f5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  teamTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#12382d",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f2f0ed",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#12382d",
  },
  statLabel: {
    fontSize: 12,
    color: "#536761",
    marginTop: 6,
  },
});
