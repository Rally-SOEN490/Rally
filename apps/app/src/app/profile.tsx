// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const stats = [
  { label: "Matches", value: "132" },
  { label: "Wins", value: "90" },
  { label: "Events", value: "11" },
  { label: "Team", value: "9" },
];

const awards = [
  { name: "100 matches", tone: "gold" },
  { name: "Podium", tone: "silver" },
  { name: "Captain", tone: "bronze" },
  { name: "10 streak", tone: "gray" },
];

const interests = ["Beach 2s", "Indoor 6s", "Outdoor 6s", "Grass 4s"];

const results = [
  { title: "Nationals, 9-man", type: "2nd - Silver", date: "Jul 2026" },
  { title: "Summer Slam 6s", type: "3rd - Bronze", date: "Jun 2026" },
  { title: "Verdun Spring Open", type: "1st - Gold", date: "May 2026" },
  { title: "Fall Classic 6s", type: "1st - Gold", date: "May 2025" },
];

export default function Profile() {
  const params = useLocalSearchParams<{ deleted?: string }>();
  const isDeleted = params.deleted === "true";

  const displayName = isDeleted ? "Deleted player" : "Maya Tremblay";
  const badgeText = isDeleted ? "DP" : "M";
  const position = isDeleted ? "Past results remain on team history" : "Outside hitter";
  const team = isDeleted ? "Deleted account" : "Sunbirds";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Pressable
            style={styles.iconButton}
            onPress={() => router.push("/settings")}
            accessibilityLabel="Open settings"
          >
            <Text style={styles.gearIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{badgeText}</Text>
            </View>
          </View>

          <Text style={styles.name}>{displayName}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{position}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{team}</Text>
          </View>

          <View style={styles.teamBanner}>
            <Text style={styles.teamIcon}>🏐</Text>
            <Text style={styles.teamName}>{isDeleted ? "Past Results Only" : "Sunbirds"}</Text>
            <Text style={styles.teamBadge}>{isDeleted ? "Removed" : "Captain"}</Text>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Awards</Text>
            <Text style={styles.sectionMeta}>6 of 12</Text>
          </View>

          <View style={styles.awardsRow}>
            {awards.map((award, index) => (
              <View key={`${award.name}-${index}`} style={styles.awardPill}>
                <Text style={styles.awardIcon}>{award.tone === "gold" ? "🥇" : award.tone === "silver" ? "🥈" : award.tone === "bronze" ? "🥉" : "🏅"}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tagsBlock}>
            <Text style={styles.sectionTitle}>Interested in</Text>
            <View style={styles.tagsRow}>
              {interests.map((interest) => (
                <View key={interest} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.resultsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Results</Text>
            <Text style={styles.sectionMeta}>See all</Text>
          </View>

          {results.map((result) => (
            <View key={result.title} style={styles.resultItem}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>{result.type.startsWith("1") ? "🥇" : result.type.startsWith("2") ? "🥈" : "🥉"}</Text>
              </View>
              <View style={styles.resultTextWrap}>
                <Text style={styles.resultTitle}>{isDeleted ? "Deleted player" : result.title}</Text>
                <Text style={styles.resultMeta}>{isDeleted ? "Historical results kept anonymous" : result.type}</Text>
              </View>
              <Text style={styles.resultDate}>{result.date}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomNav}>
          {[
            ["Home", "⌂"],
            ["Events", "◫"],
            ["Teams", "◌"],
            ["Search", "⌕"],
            ["You", "◔"],
          ].map(([label, icon]) => (
            <Pressable key={label} style={label === "You" ? styles.navItemActive : styles.navItem}>
              <Text style={label === "You" ? styles.navIconActive : styles.navIcon}>{icon}</Text>
              <Text style={label === "You" ? styles.navLabelActive : styles.navLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f1ee",
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: "#f3f1ee",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e4df",
  },
  backArrow: {
    fontSize: 28,
    color: "#1d2d2a",
    fontWeight: "500",
    marginTop: -3,
  },
  gearIcon: {
    fontSize: 18,
    color: "#1d2d2a",
  },
  profileCard: {
    backgroundColor: "#f6f3f1",
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: "#d7d0c8",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#e1d7c8",
    borderWidth: 3,
    borderColor: "#f7f4f2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1d2d2a",
  },
  name: {
    fontSize: 38,
    fontWeight: "800",
    color: "#1d2d2a",
    textAlign: "center",
    marginTop: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#4f5751",
  },
  dot: {
    fontSize: 14,
    color: "#4f5751",
  },
  teamBanner: {
    marginTop: 18,
    backgroundColor: "#1f4f46",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamIcon: {
    fontSize: 18,
  },
  teamName: {
    flex: 1,
    marginLeft: 8,
    color: "#efefe8",
    fontWeight: "700",
    fontSize: 16,
  },
  teamBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#f4f1ee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f1efe9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1d2d2a",
  },
  statLabel: {
    fontSize: 12,
    color: "#5e6561",
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    color: "#1d2d2a",
    fontWeight: "700",
  },
  sectionMeta: {
    fontSize: 13,
    color: "#4f5751",
  },
  awardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  awardPill: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dfe0df",
    alignItems: "center",
    justifyContent: "center",
  },
  awardIcon: {
    fontSize: 24,
  },
  tagsBlock: {
    marginTop: 18,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  tag: {
    backgroundColor: "#ece7e0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagText: {
    color: "#2b403b",
    fontSize: 12,
    fontWeight: "600",
  },
  resultsSection: {
    marginTop: 26,
    backgroundColor: "#f5f2ee",
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d8d0c9",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f2ee",
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  resultBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8ded5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultBadgeText: {
    fontSize: 16,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 13,
    color: "#1d2d2a",
    fontWeight: "700",
  },
  resultMeta: {
    fontSize: 11,
    color: "#5d655f",
    marginTop: 2,
  },
  resultDate: {
    color: "#4e5652",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f4f1",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#d8d0ca",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  navItemActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  navIcon: {
    fontSize: 18,
    color: "#65736f",
  },
  navIconActive: {
    fontSize: 18,
    color: "#1d2d2a",
    fontWeight: "700",
  },
  navLabel: {
    fontSize: 11,
    color: "#65736f",
    marginTop: 2,
  },
  navLabelActive: {
    fontSize: 11,
    color: "#1d2d2a",
    fontWeight: "700",
    marginTop: 2,
  },
});
