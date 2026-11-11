// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GoldStars } from "@/components/badges/goldStars";
import { type Badge, badgeImageSource, badgeProgress, sortBadges, tierColor } from "@/lib/badges";
import type { RallyUser } from "@/lib/api";
import { sharedStyles } from "./styles";

// Up to four badges: the ones the player chose to show, or their top four
// when they haven't chosen yet.
const shownBadges = (account: RallyUser | null | undefined, selectedBadgeKeys: string[]) => {
  const hasSavedShownBadges = account?.shownBadgeKeys !== undefined;
  return sortBadges(account?.badges ?? [])
    .filter((badge) => (hasSavedShownBadges ? selectedBadgeKeys.includes(badge.key) : true))
    .slice(0, 4);
};

function BadgeProgress({ badge }: { badge: Badge }) {
  const progress = badgeProgress(badge);
  if (!progress) return null;
  return (
    <>
      <View accessible accessibilityLabel={`${badge.name} progress`} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress.percentage * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {badge.receivedCount}/{progress.target}
      </Text>
    </>
  );
}

function AwardBadge({ badge, onPress }: { badge: Badge; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.name} badge`}
      onPress={onPress}
      style={styles.awardBadge}
    >
      <View style={styles.awardImageWrapper}>
        {badge.tier === "Gold" && <GoldStars />}
        <Image
          accessibilityLabel={`${badge.name} badge image`}
          source={badgeImageSource(badge)}
          style={[styles.awardImage, { borderColor: tierColor(badge) }]}
        />
      </View>
      <Text style={styles.awardName}>{badge.name}</Text>
      <BadgeProgress badge={badge} />
    </Pressable>
  );
}

// The badges shown on the profile, with a link to all of them.
export function AwardsPreview({
  account,
  selectedBadgeKeys,
  onSelectBadge,
}: {
  account: RallyUser | null | undefined;
  selectedBadgeKeys: string[];
  onSelectBadge: (badge: Badge) => void;
}) {
  const badges = shownBadges(account, selectedBadgeKeys);
  return (
    <View style={styles.awardsSection}>
      <View style={styles.awardsHeader}>
        <Text style={sharedStyles.sectionTitle}>Awards</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View more awards"
          onPress={() => router.push("/awards")}
        >
          <Text style={sharedStyles.linkText}>View more</Text>
        </Pressable>
      </View>
      <View accessible accessibilityLabel="Awards" style={styles.awardsRow}>
        {badges.map((badge) => (
          <AwardBadge key={badge.key} badge={badge} onPress={() => onSelectBadge(badge)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  awardsSection: {
    marginTop: 24,
  },
  awardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  awardsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 12,
    width: "100%",
  },
  awardBadge: {
    width: 72,
    alignItems: "center",
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
  awardName: {
    color: "#12382d",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
  progressTrack: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d9d5d0",
    marginTop: 7,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#b47a2a",
  },
  progressText: {
    color: "#536761",
    fontSize: 9,
    marginTop: 3,
  },
});
