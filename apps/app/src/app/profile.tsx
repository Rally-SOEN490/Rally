import { TournamentResults } from "@/components/profile/TournamentResults";
import { UpcomingTeamBanner } from "@/components/profile/UpcomingTeamBanner";
import { StatusBar } from "expo-status-bar";
import { ProfileIcon } from "@/components/profile/ProfileIcon";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { profileCopy } from "@/locales/en/profile";
import { ProfileMessage } from "@/components/profile/ProfileMessage";
import { router } from "expo-router";
import {
  Image,
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

const badgeImages = {
  "badge-gold-placeholder": require("@/assets/images/badge-gold-placeholder.png"),
} as const;

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
            <ProfileIcon name="person" size={64} color="#a4b3ad" />
          </View>
          <Text style={styles.playerName}>{account?.displayName}</Text>
        </View>

        {user && account && <ProfileMessage key={user.uid} user={user} />}

        {user && account && <UpcomingTeamBanner key={`upcoming/${user.uid}`} user={user} />}

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
                  <Image
                    accessibilityLabel={`${badge.name} badge image`}
                    source={badgeImages[badge.image as keyof typeof badgeImages]}
                    style={[
                      styles.awardImage,
                      { borderColor: tierColors[badge.tier as keyof typeof tierColors] },
                    ]}
                  />
                </View>
                <Text style={styles.awardName}>{badge.name}</Text>
              </Pressable>
              ))}
          </ScrollView>
        </View>

        <View style={styles.tagSection}>
          <Text style={styles.sectionTitle}>{profileCopy.interests}</Text>
          <View style={styles.tagPill}><Text style={styles.tagText}>{profileCopy.noInterests}</Text></View>
        </View>

        {user && account && <TournamentResults key={`results/${user.uid}`} user={user} />}
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
  navIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  awardCount: { fontSize: 10, color: "#839387" },
  safeArea: { flex: 1, backgroundColor: "#f4f5ef" },
  content: { paddingHorizontal: 18, paddingBottom: 100, width: "100%", maxWidth: 480, alignSelf: "center" },
  profileHeader: { height: 0, zIndex: 1 },
  gearButton: { position: "absolute", top: 12, right: 0, backgroundColor: "#fff", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e8ece4" },
  avatarSection: { alignItems: "center", paddingTop: 20 },
  avatarBadge: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#e8ece6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: "#b7c5bb" },
  playerName: { marginTop: 12, fontSize: 22, fontWeight: "800", color: "#172e25" },
  awardsSection: { marginTop: 18 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#172e25" },
  awardsRow: { flexDirection: "row", gap: 12, marginTop: 10, paddingBottom: 2, paddingRight: 4 },
  awardBadge: { width: 74, minHeight: 76, alignItems: "center", justifyContent: "flex-start" },
  awardImage: { width: 46, height: 46, borderWidth: 2, borderRadius: 23, backgroundColor: "#264f40" },
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
  tagPill: { alignSelf: "flex-start", marginTop: 10, backgroundColor: "#fff", borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#e4e9df" },
  tagText: { fontSize: 10, color: "#718378" },
  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBar: { position: "absolute", bottom: 10, width: "94%", maxWidth: 460, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 36, borderWidth: 1, borderColor: "#e6ebe1", paddingVertical: 6, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", boxShadow: "0px 5px 18px rgba(28,57,43,0.12)" },
  navItem: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center" },
  navItemActive: { backgroundColor: "#dfebe2" },
  navLabel: { fontSize: 9, marginTop: 1, color: "#6c8177" },
  navLabelActive: { color: "#234d40", fontWeight: "700" },
});
