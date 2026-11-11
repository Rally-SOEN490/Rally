// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet, Text, View } from "react-native";
import { sharedStyles } from "./styles";

// Placeholder results until tournament results exist.
const results = [
  { title: "Nationals, 9-man", year: "Jul 2026", accent: "#f3e5c9" },
  { title: "Summer Slam 6s", year: "Jun 2026", accent: "#f7d7b4" },
  { title: "Verdun Spring Open", year: "May 2026", accent: "#e0e7b8" },
  { title: "Fall Classic 6s", year: "Sep 2025", accent: "#d9e8dc" },
];

export function RecentResults() {
  return (
    <View style={styles.resultsSection}>
      <View style={styles.resultsHeader}>
        <Text style={sharedStyles.sectionTitle}>Results</Text>
        <Text style={sharedStyles.linkText}>See all</Text>
      </View>
      <View style={styles.resultList}>
        {results.map((result) => (
          <View key={result.title} style={styles.resultItem}>
            <View style={[styles.resultBadge, { backgroundColor: result.accent }]}>
              <Text style={styles.resultBadgeText}>🏆</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{result.title}</Text>
            </View>
            <Text style={styles.resultYear}>{result.year}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsSection: {
    marginTop: 24,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultList: {
    marginTop: 12,
    gap: 10,
  },
  resultItem: {
    backgroundColor: "#f2f0ed",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  resultBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  resultBadgeText: {
    fontSize: 18,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#12382d",
  },
  resultYear: {
    fontSize: 12,
    color: "#5d6c68",
    fontWeight: "600",
  },
});
