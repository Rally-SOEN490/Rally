// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/lib/session";

const sponsoredTournament = {
  name: "Con Khi Volleyball Tournament",
  details: "Vanier College • 9:00 AM - 16:00 PM",
  slots: "8 of 16 spots left",
  badge: "SAT\nOCT\n17",
};

const recruitingCards = [
  { team: "Falcons Co-ed 6s", needs: "Needs: Setter, Libero", accent: "#ecb8a6" },
  { team: "Riptide Rec League", needs: "Needs: Outside Hitter", accent: "#9ad4a7" },
];

const announcements = [
  {
    title: "Fall Classic bracket released",
    detail: "Pool play groups are now live — check your team’s schedule",
    time: "2h ago",
  },
  {
    title: "Practice times updated",
    detail: "Wednesday night session moved to 7:30 PM",
    time: "1d ago",
  },
];

export default function Home() {
  // The guards in _layout.tsx only show Home to someone with a Rally account.
  const { account } = useSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.phoneShell}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>RALLY</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Welcome back,</Text>
            <Text style={styles.heroName}>{account?.displayName}</Text>
            {account && (
              <Text style={styles.heroNote}>
                Member since {new Date(account.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Upcoming Match</Text>
            <View style={styles.matchHeader}>
              <View>
                <Text style={styles.matchTitle}>Sunbirds vs Falcons</Text>
                <Text style={styles.matchMeta}>Sat, Oct 10 • 2:00 PM</Text>
                <Text style={styles.matchMeta}>Loyola Gym</Text>
              </View>
              <View style={styles.pinBadge}>
                <Text style={styles.pinText}>📍</Text>
              </View>
            </View>
            <Pressable style={styles.primaryButton} accessibilityRole="button">
              <Text style={styles.primaryText}>View Match Details →</Text>
            </Pressable>
          </View>

          <View style={styles.tournamentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Sponsored Tournaments</Text>
              <Text style={styles.linkText}>See all</Text>
            </View>

            <View style={styles.tournamentCard}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateMonth}>SAT</Text>
                <Text style={styles.dateDay}>17</Text>
              </View>
              <View style={styles.tournamentBody}>
                <Text style={styles.tournamentName}>{sponsoredTournament.name}</Text>
                <Text style={styles.tournamentDetails}>{sponsoredTournament.details}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaTag}>Indoor 6s</Text>
                  <Text style={styles.metaTag}>Mixed C+</Text>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressBar} />
                </View>
                <Text style={styles.slotsText}>{sponsoredTournament.slots}</Text>
              </View>
              <Pressable style={styles.registerButton} accessibilityRole="button">
                <Text style={styles.registerText}>Register</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.tournamentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Team Recruiting Near You</Text>
              <Text style={styles.linkText}>See all</Text>
            </View>
            <View style={styles.recruitingList}>
              {recruitingCards.map((card) => (
                <View key={card.team} style={styles.recruitingCard}>
                  <View style={[styles.badgeBubble, { backgroundColor: card.accent }]}>
                    <Text style={styles.badgeEmoticon}>🏐</Text>
                  </View>
                  <View style={styles.recruitingInfo}>
                    <Text style={styles.recruitingTitle}>{card.team}</Text>
                    <Text style={styles.recruitingNeeds}>{card.needs}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.announcementSection}>
            <Text style={styles.sectionHeading}>Latest Announcements</Text>
            {announcements.map((item) => (
              <View key={item.title} style={styles.announcementItem}>
                <View style={styles.announcementIcon}>
                  <Text style={styles.announcementEmoji}>📣</Text>
                </View>
                <View style={styles.announcementBody}>
                  <Text style={styles.announcementTitle}>{item.title}</Text>
                  <Text style={styles.announcementDetail}>{item.detail}</Text>
                </View>
                <Text style={styles.announcementTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8e4df",
  },
  scrollContent: {
    paddingBottom: 110, // room for the floating nav bar
  },
  phoneShell: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  topBar: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#12382d",
  },
  heroCard: {
    backgroundColor: "#153d32",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 28,
    marginTop: 8,
    minHeight: 120,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f5f3ef",
    marginBottom: 2,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f5f3ef",
  },
  heroNote: {
    fontSize: 14,
    color: "#c9d6d0",
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: "#f2f0ed",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#4d5d58",
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#12382d",
    marginBottom: 4,
  },
  matchMeta: {
    fontSize: 14,
    color: "#4a5d5a",
    marginTop: 2,
  },
  pinBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dfe9e4",
    alignItems: "center",
    justifyContent: "center",
  },
  pinText: {
    fontSize: 18,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#12382d",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#f3f7f6",
    fontSize: 16,
    fontWeight: "700",
  },
  tournamentSection: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#12382d",
  },
  linkText: {
    fontSize: 14,
    color: "#204d42",
    fontWeight: "600",
  },
  tournamentCard: {
    backgroundColor: "#f2f0ed",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  dateBadge: {
    width: 64,
    backgroundColor: "#1a4338",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dateMonth: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  tournamentBody: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12382d",
    marginBottom: 6,
  },
  tournamentDetails: {
    fontSize: 12,
    color: "#4d5d58",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  metaTag: {
    backgroundColor: "#dfe9e4",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: "#22463d",
    fontWeight: "600",
  },
  progressRow: {
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#d1d8d3",
    width: "70%",
  },
  slotsText: {
    fontSize: 11,
    color: "#4d5d58",
    marginTop: 4,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#12382d",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  registerText: {
    color: "#f5f3ef",
    fontWeight: "700",
    fontSize: 13,
  },
  recruitingList: {
    gap: 10,
  },
  recruitingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f0ed",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  badgeBubble: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgeEmoticon: {
    fontSize: 22,
  },
  recruitingInfo: {
    flex: 1,
  },
  recruitingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12382d",
  },
  recruitingNeeds: {
    fontSize: 12,
    color: "#546863",
    marginTop: 4,
  },
  announcementSection: {
    marginTop: 24,
  },
  announcementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f2f0ed",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#dfe9e4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  announcementEmoji: {
    fontSize: 18,
  },
  announcementBody: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12382d",
  },
  announcementDetail: {
    fontSize: 12,
    color: "#4d5d58",
    marginTop: 4,
  },
  announcementTime: {
    fontSize: 11,
    color: "#687872",
    marginLeft: 8,
    marginTop: 4,
  },
});
