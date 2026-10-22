import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RallyUser } from "@/lib/api";
import { useSession } from "@/lib/session";

const badgeImages = {
  "badge-gold-placeholder": require("@/assets/images/badge-gold-placeholder.png"),
} as const;
const lockImage = require("@/assets/images/Lock.png");

const tierColors = {
  Bronze: "#8c5a3c",
  Silver: "#9aa1a8",
  Gold: "#d4a72c",
} as const;

const lockedAwards = [
  ["streak", "10 streak", "Win 10 in a row", "6/10"],
  ["champion", "Champion", "Win a tournament", "0/1"],
  ["matches", "250 matches", "Play 250 matches", "132/250"],
  ["wins", "100 wins", "Win 100 matches", "90/100"],
  ["events", "10 events", "Enter 10 events", "5/10"],
  ["team-builder", "Team builder", "Start a team", "0/1"],
] as const;

const getBadgeProgress = (receivedCount: number, nextTierThreshold?: number | null) => {
  const target =
    nextTierThreshold ?? (Math.floor(Math.max(0, receivedCount) / 10) + 1) * 10;
  return { target, percentage: Math.min(receivedCount / target, 1) };
};

const sortBadges = (badges: RallyUser["badges"]) =>
  [...badges].sort(
    (left, right) =>
      right.receivedCount - left.receivedCount || left.key.localeCompare(right.key),
  );

export default function Awards() {
  const { account, selectedBadgeKeys, toggleBadgeSelection } = useSession();
  const badges = sortBadges(account?.badges ?? []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to profile"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Awards</Text>
        <Text style={styles.sectionTitle}>Player Awards ({badges.length})</Text>
        <Text style={styles.subtitle}>
          Choose 4 to show on your profile. {Math.min(selectedBadgeKeys.length, 4)} of 4 selected.
        </Text>
        <View style={styles.awardsCard}>
          <View style={styles.grid}>
            {badges.map((badge) => (
              <AwardTile
                key={badge.key}
                badge={badge}
                selected={selectedBadgeKeys.includes(badge.key)}
                onPress={() => toggleBadgeSelection(badge.key)}
              />
            ))}
          </View>
        </View>

        <Text style={styles.lockedTitle}>Locked Awards ({lockedAwards.length})</Text>
        <View style={styles.awardsCard}>
          <View style={styles.grid}>
            {lockedAwards.map(([key, name, requirement, progress]) => (
              <View key={key} style={styles.awardTile}>
                <View style={styles.imageWrapper}>
                  <Image
                    accessibilityLabel={`${name} locked award image`}
                    source={badgeImages["badge-gold-placeholder"]}
                    style={styles.lockedImage}
                  />
                  <View pointerEvents="none" style={styles.lockedOverlay} />
                  <Image
                    accessibilityLabel={`${name} locked award lock`}
                    source={lockImage}
                    style={styles.lock}
                  />
                </View>
                <Text style={styles.awardName}>{name}</Text>
                <Text style={styles.tierText}>{requirement}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent(progress)}%` }]} />
                </View>
                <Text style={styles.progressText}>{progress}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AwardTile({
  badge,
  selected,
  onPress,
}: {
  badge: RallyUser["badges"][number];
  selected: boolean;
  onPress: () => void;
}) {
  const progress = badge.isComplete
    ? null
    : getBadgeProgress(badge.receivedCount, badge.nextTierThreshold);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.name} award`}
      onPress={onPress}
      style={styles.awardTile}
    >
      <View style={styles.imageWrapper}>
        {badge.tier === "Gold" && (
          <>
            <Text style={[styles.goldStar, styles.goldStarTop]}>✦</Text>
            <Text style={[styles.goldStar, styles.goldStarRight]}>✦</Text>
            <Text style={[styles.goldStar, styles.goldStarBottom]}>✦</Text>
            <Text style={[styles.goldStar, styles.goldStarLeft]}>✦</Text>
          </>
        )}
        <Image
          accessibilityLabel={`${badge.name} award image`}
          source={badgeImages[badge.image as keyof typeof badgeImages]}
          style={[styles.awardImage, { borderColor: tierColors[badge.tier as keyof typeof tierColors] }]}
        />
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.awardName}>{badge.name}</Text>
      <Text style={styles.tierText}>{badge.tier.toUpperCase()}</Text>
      {progress && (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.percentage * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{badge.receivedCount}/{progress.target}</Text>
        </>
      )}
    </Pressable>
  );
}

const progressPercent = (value: string) => {
  const [current, target] = value.split("/").map(Number);
  return target ? Math.min((current / target) * 100, 100) : 0;
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f3ef" },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  backIcon: { fontSize: 28, lineHeight: 30, color: "#12382d", marginTop: -2 },
  pageTitle: { marginTop: 18, fontSize: 28, fontWeight: "800", color: "#12382d" },
  sectionTitle: { marginTop: 18, fontSize: 15, fontWeight: "800", color: "#12382d" },
  subtitle: { marginTop: 5, fontSize: 11, color: "#718079" },
  lockedTitle: { marginTop: 18, fontSize: 15, fontWeight: "800", color: "#12382d" },
  awardsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e1dfda",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 18 },
  awardTile: { width: "25%", alignItems: "center" },
  imageWrapper: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  awardImage: { width: 42, height: 42, borderWidth: 3, borderRadius: 21 },
  lockedImage: { width: 42, height: 42, borderRadius: 21, opacity: 0.5 },
  lockedOverlay: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(109, 123, 117, 0.48)",
  },
  goldStar: {
    position: "absolute",
    color: "#d4a72c",
    fontSize: 11,
    lineHeight: 11,
  },
  goldStarTop: { top: 0 },
  goldStarRight: { right: 0 },
  goldStarBottom: { bottom: 0 },
  goldStarLeft: { left: 0 },
  checkmark: {
    position: "absolute", right: -1, top: -1, width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#164d3d", color: "#fff", fontSize: 11, textAlign: "center",
  },
  lock: {
    position: "absolute", right: -1, bottom: -1, width: 16, height: 16, borderRadius: 8,
    tintColor: "#718079",
  },
  awardName: { marginTop: 3, color: "#12382d", fontSize: 10, textAlign: "center" },
  tierText: { marginTop: 2, color: "#718079", fontSize: 9, textAlign: "center" },
  progressTrack: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#d9d5d0", marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: "#b47a2a" },
  progressText: { marginTop: 2, color: "#718079", fontSize: 9 },
});
