// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoldStars } from "@/components/badges/goldStars";
import {
  type Badge,
  badgeImages,
  badgeImageSource,
  badgeProgress,
  sortBadges,
  tierColor,
} from "@/lib/badges";
import { useSession } from "@/lib/session";

const lockImage = require("@/assets/images/Lock.png");

const lockedAwards = [
  ["streak", "10 streak", "Win 10 in a row", "6/10"],
  ["champion", "Champion", "Win a tournament", "0/1"],
  ["matches", "250 matches", "Play 250 matches", "132/250"],
  ["wins", "100 wins", "Win 100 matches", "90/100"],
  ["events", "10 events", "Enter 10 events", "5/10"],
  ["team-builder", "Team builder", "Start a team", "0/1"],
] as const;

export default function Awards() {
  const { account, selectedBadgeKeys, toggleBadgeSelection } = useSession();
  const badges = sortBadges(account?.badges ?? []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />

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
              <LockedAwardTile
                key={key}
                name={name}
                requirement={requirement}
                progress={progress}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to profile"
      onPress={() => router.back()}
      style={styles.backButton}
    >
      <Text style={styles.backIcon}>‹</Text>
    </Pressable>
  );
}

// An award the player hasn't earned yet, greyed out with a lock.
function LockedAwardTile({
  name,
  requirement,
  progress,
}: {
  name: string;
  requirement: string;
  progress: string;
}) {
  return (
    <View style={styles.awardTile}>
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
  );
}

function AwardTile({
  badge,
  selected,
  onPress,
}: {
  badge: Badge;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = badgeProgress(badge);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.name} award${selected ? " selected" : ""}`}
      testID={`${badge.key}-award`}
      onPress={onPress}
      style={styles.awardTile}
    >
      <View style={styles.imageWrapper}>
        {badge.tier === "Gold" && <GoldStars />}
        <Image
          accessibilityLabel={`${badge.name} award image`}
          source={badgeImageSource(badge)}
          style={[styles.awardImage, { borderColor: tierColor(badge) }]}
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
          <Text style={styles.progressText}>
            {badge.receivedCount}/{progress.target}
          </Text>
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
  checkmark: {
    position: "absolute",
    right: -1,
    top: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#164d3d",
    color: "#fff",
    fontSize: 11,
    textAlign: "center",
  },
  lock: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    tintColor: "#718079",
  },
  awardName: { marginTop: 3, color: "#12382d", fontSize: 10, textAlign: "center" },
  tierText: { marginTop: 2, color: "#718079", fontSize: 9, textAlign: "center" },
  progressTrack: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d9d5d0",
    marginTop: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: "#b47a2a" },
  progressText: { marginTop: 2, color: "#718079", fontSize: 9 },
});
