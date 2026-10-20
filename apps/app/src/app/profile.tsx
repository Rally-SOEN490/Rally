import { profileCopy } from "@/locales/en/profile";
import { TournamentResults } from "@/components/profile/TournamentResults";
import { UpcomingTeamBanner } from "@/components/profile/UpcomingTeamBanner";
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.profileHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
            style={styles.gearButton}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </Pressable>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{account?.displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.playerName}>{account?.displayName}</Text>
        </View>

        {user && account && <ProfileMessage key={user.uid} user={user} />}

        {user && account && <UpcomingTeamBanner key={`upcoming/${user.uid}`} user={user} />}

        <View style={styles.awardsSection}>
          <Text style={styles.sectionTitle}>Awards</Text>
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
          <Text style={styles.sectionTitle}>Interested in</Text>
          <Text style={styles.emptyText}>{profileCopy.noInterests}</Text>
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
          { label: "Home" },
          { label: "Events" },
          { label: "Search" },
          { label: "Notifications" },
          { label: "You", active: true },
        ].map((item) => (
          <Pressable
            key={item.label}
            style={[styles.navItem, item.active && styles.navItemActive]}
            onPress={() => {
              if (item.label === "Home") router.replace("/home");
            }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={[styles.navIcon, item.active && styles.navIconActive]}>
              {item.label === "Home" ? "⌂" : item.label === "Events" ? "◫" : item.label === "Search" ? "⌕" : item.label === "Notifications" ? "◔" : "◉"}
            </Text>
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8e4df",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  profileHeader: {
    alignItems: "flex-end",
    paddingTop: 18,
    paddingBottom: 8,
  },
  gearButton: {
    backgroundColor: "#f4f1ee",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: {
    fontSize: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 8,
  },
  avatarBadge: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#d5d9d1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#f7f4f1",
  },
  avatarText: {
    fontSize: 52,
    fontWeight: "700",
    color: "#12382d",
  },
  playerName: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "800",
    color: "#12382d",
  },
  awardsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#12382d",
  },
  awardsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    paddingRight: 4,
  },
  awardBadge: {
    width: 72,
    minHeight: 82,
    borderRadius: 16,
    backgroundColor: "#dfe9e4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  awardImage: {
    width: 34,
    height: 34,
    borderWidth: 3,
    borderRadius: 17,
  },
  awardImageWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  goldStar: {
    position: "absolute",
    color: "#d4a72c",
    fontSize: 11,
    lineHeight: 11,
  },
  goldStarTop: {
    top: 0,
  },
  goldStarRight: {
    right: 0,
  },
  goldStarBottom: {
    bottom: 0,
  },
  goldStarLeft: {
    left: 0,
  },
  awardName: {
    color: "#12382d",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
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
  emptyText: { color: "#536761", fontSize: 14, marginTop: 12 },
  tagSection: {
    marginTop: 22,
  },
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
  navItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: "#dfe9e4",
  },
  navIcon: {
    fontSize: 18,
    color: "#4d5d58",
  },
  navIconActive: {
    color: "#12382d",
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    color: "#4d5d58",
    fontWeight: "600",
  },
  navLabelActive: {
    color: "#12382d",
  },
});
