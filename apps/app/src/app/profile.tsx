import { StatusBar } from "expo-status-bar";
import { ProfileIcon } from "@/components/profile/ProfileIcon";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { profileCopy } from "@/locales/en/profile";
import { ProfileMessage } from "@/components/profile/ProfileMessage";
import { router } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RallyUser } from "@/lib/api";
import { useSession } from "@/lib/session";

const interested = ["Beach 2s", "Indoor 6s", "Cobra 6s", "Weekend leagues"];
const results = [
  { title: "Nationals, 9-man", year: "Jul 2026", accent: "#f3e5c9" },
  { title: "Summer Slam 6s", year: "Jun 2026", accent: "#f7d7b4" },
  { title: "Verdun Spring Open", year: "May 2026", accent: "#e0e7b8" },
  { title: "Fall Classic 6s", year: "Sep 2025", accent: "#d9e8dc" },
];

const tierColors = {
  Bronze: "#8c5a3c",
  Silver: "#9aa1a8",
  Gold: "#d4a72c",
} as const;

export default function Profile() {
  // The guards in _layout.tsx only show Profile to someone with a Rally account.
  const { account, user } = useSession();
  const [selectedBadge, setSelectedBadge] = useState<RallyUser["badges"][number] | null>(
    null,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.profileHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
            style={styles.gearButton}
          >
            <ProfileIcon name="settings" size={18} />
          </Pressable>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarBadge}>
            <View style={styles.avatarSilhouette}><View style={styles.avatarHead} /><View style={styles.avatarShoulders} /></View>
          </View>
          <Text style={styles.playerName}>{account?.displayName}</Text>
        </View>

        {user && account && <ProfileMessage key={user.uid} user={user} />}

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

        <ProfileStats />

        <View style={styles.awardsSection}>
          <View style={styles.resultsHeader}><Text style={styles.sectionTitle}>{profileCopy.awards}</Text><Text style={styles.awardCount}>{account?.badges.length ?? 0}</Text></View>
          <ScrollView
            horizontal
            accessible
            accessibilityLabel="Scrollable awards"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.awardsRow}
          >
            {[...(account?.badges ?? [])]
              .sort(
                (left, right) =>
                  right.receivedCount - left.receivedCount ||
                  left.key.localeCompare(right.key),
              )
              .map((badge) => (
              <Pressable
                key={badge.key}
                accessibilityRole="button"
                accessibilityLabel={`${badge.name} badge`}
                onPress={() => setSelectedBadge(badge)}
                style={styles.awardBadge}
              >
                <View style={styles.awardImageWrapper}>
                  {badge.tier === "Gold" && (
                    <>
                      <Text style={[styles.goldStar, styles.goldStarTop]}>✦</Text>
                      <Text style={[styles.goldStar, styles.goldStarRight]}>✦</Text>
                      <Text style={[styles.goldStar, styles.goldStarBottom]}>✦</Text>
                      <Text style={[styles.goldStar, styles.goldStarLeft]}>✦</Text>
                    </>
                  )}
                  <View
                    accessibilityRole="image"
                    accessibilityLabel={`${badge.name} badge image`}
                    style={[styles.awardImage, { borderColor: tierColors[badge.tier as keyof typeof tierColors] }]}
                  >
                    <ProfileIcon name={badge.key === "blocker" ? "block" : badge.key === "clutch" ? "bolt" : badge.key === "competitor" ? "ball" : badge.key === "defender" ? "shield" : "events"} size={23} color={tierColors[badge.tier as keyof typeof tierColors] ?? "#d4a72c"} />
                  </View>
                </View>
                <Text style={styles.awardName}>{badge.name}</Text>
              </Pressable>
              ))}
          </ScrollView>
        </View>

        <View style={styles.tagSection}>
          <Text style={styles.sectionTitle}>{profileCopy.interests}</Text>
          <View style={styles.tagRow}>
            {interested.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Results</Text>
            <Text style={styles.linkText}>See all</Text>
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
      </ScrollView>

      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable
          onPress={() => setSelectedBadge(null)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.badgeDetails}
          >
            <Text style={styles.badgeDetailsTitle}>{selectedBadge?.name}</Text>
            <Text style={styles.badgeDetailsTier}>{selectedBadge?.tier} tier</Text>
            <Text style={styles.badgeDetailsDescription}>
              {selectedBadge?.description}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close badge details"
              onPress={() => setSelectedBadge(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.navBar}>
        {[
          { label: profileCopy.home, icon: "home" as const },
          { label: profileCopy.events, icon: "events" as const },
          { label: profileCopy.teams, icon: "teams" as const },
          { label: profileCopy.search, icon: "search" as const },
          { label: profileCopy.you, icon: "person" as const, active: true },
        ].map((item) => (
          <Pressable
            key={item.label}
            style={styles.navItem}
            onPress={() => {
              if (item.label === "Home") router.replace("/home");
            }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            disabled={!item.active && item.label !== profileCopy.home}
            accessibilityState={{ selected: !!item.active, disabled: !item.active && item.label !== profileCopy.home }}
          >
            <View style={[styles.navIconCircle, item.active && styles.navItemActive]}>
              <ProfileIcon name={item.icon} size={18} color={item.active ? "#204d3e" : "#6c8177"} />
            </View>
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarSilhouette: { width: 58, height: 58, alignItems: "center", justifyContent: "flex-end" },
  avatarHead: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#a5b2ab", marginBottom: 5 },
  avatarShoulders: { width: 42, height: 25, borderTopLeftRadius: 23, borderTopRightRadius: 23, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: "#a5b2ab" },
  navIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  awardCount: { fontSize: 10, color: "#839387" },
  safeArea: { flex: 1, backgroundColor: "#f4f5ef" },
  content: { paddingHorizontal: 18, paddingBottom: 100, width: "100%", maxWidth: 480, alignSelf: "center" },
  profileHeader: { height: 0, zIndex: 1 },
  gearButton: { position: "absolute", top: 12, right: 0, backgroundColor: "#fff", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e8ece4" },
  gearIcon: {
    fontSize: 20,
  },
  avatarSection: { alignItems: "center", paddingTop: 20 },
  avatarBadge: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#e8ece6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: "#b7c5bb" },
  avatarText: {
    fontSize: 52,
    fontWeight: "700",
    color: "#12382d",
  },
  playerName: { marginTop: 12, fontSize: 22, fontWeight: "800", color: "#172e25" },
  playerMeta: { marginTop: 3, fontSize: 11, color: "#718378" },
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
  awardsSection: { marginTop: 18 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#172e25" },
  awardsRow: { flexDirection: "row", gap: 12, marginTop: 10, paddingBottom: 2, paddingRight: 4 },
  awardBadge: { width: 74, minHeight: 76, alignItems: "center", justifyContent: "flex-start" },
  awardImage: { width: 46, height: 46, borderWidth: 2, borderRadius: 23, backgroundColor: "#264f40", alignItems: "center", justifyContent: "center", boxShadow: "0px 2px 5px rgba(28,57,43,0.18)" },
  awardImageWrapper: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29, backgroundColor: "#e3e9dc" },
  goldStar: { position: "absolute", color: "#d4a72c", fontSize: 6, lineHeight: 7 },
  goldStarTop: { top: 0 },
  goldStarRight: { right: 0 },
  goldStarBottom: { bottom: 0 },
  goldStarLeft: { left: 0 },
  awardName: { color: "#30493c", fontSize: 9, marginTop: 5, textAlign: "center" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 56, 45, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  badgeDetails: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#f7f4f1",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  badgeDetailsTitle: {
    color: "#12382d",
    fontSize: 22,
    fontWeight: "800",
  },
  badgeDetailsTier: {
    color: "#536761",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },
  badgeDetailsDescription: {
    color: "#536761",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 14,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#12382d",
    borderRadius: 999,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  closeButtonText: {
    color: "#f7f4f1",
    fontSize: 13,
    fontWeight: "700",
  },
  tagSection: { marginTop: 16 },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagPill: {
    backgroundColor: "#f2f0ed",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  tagText: {
    fontSize: 12,
    color: "#12382d",
    fontWeight: "600",
  },
  resultsSection: { marginTop: 18 },
  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkText: {
    fontSize: 14,
    color: "#204d42",
    fontWeight: "600",
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
  navBar: { position: "absolute", bottom: 10, width: "94%", maxWidth: 460, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 36, borderWidth: 1, borderColor: "#e6ebe1", paddingVertical: 6, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", boxShadow: "0px 5px 18px rgba(28,57,43,0.12)" },
  navItem: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center" },
  navItemActive: { backgroundColor: "#dfebe2" },
  navIcon: {
    fontSize: 18,
    color: "#4d5d58",
  },
  navIconActive: {
    color: "#12382d",
  },
  navLabel: { fontSize: 9, marginTop: 1, color: "#6c8177" },
  navLabelActive: { color: "#234d40", fontWeight: "700" },
});
