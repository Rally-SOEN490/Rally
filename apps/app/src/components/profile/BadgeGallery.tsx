// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RallyUser } from "@/lib/api";
import { profileText as copy } from "@/locales/en/profiles";

const badgeImages = {
  "badge-gold-placeholder": require("@/assets/images/badge-gold-placeholder.png"),
} as const;
const tierColors = {
  Bronze: "#8c5a3c",
  Silver: "#9aa1a8",
  Gold: "#d4a72c",
} as const;
export function BadgeGallery({ badges }: { badges: RallyUser["badges"] }) {
  const [selectedBadge, setSelectedBadge] = useState<
    RallyUser["badges"][number] | null
  >(null);
  return (
    <>
      <View style={styles.awardsSection}>
        <Text style={styles.sectionTitle}>{copy.awardsTitle}</Text>
        {!badges.length && <Text style={styles.empty}>{copy.noAwards}</Text>}
        <ScrollView
          horizontal
          accessible
          accessibilityLabel={copy.scrollAwards}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.awardsRow}
        >
          {[...badges]
            .sort(
              (left, right) =>
                right.receivedCount - left.receivedCount ||
                left.key.localeCompare(right.key),
            )
            .map((badge) => (
              <Pressable
                key={badge.key}
                accessibilityRole="button"
                accessibilityLabel={copy.badgeLabel(badge.name)}
                onPress={() => setSelectedBadge(badge)}
                style={styles.awardBadge}
              >
                <View style={styles.awardImageWrapper}>
                  {badge.tier === "Gold" && (
                    <>
                      <Text style={[styles.goldStar, styles.goldStarTop]}>
                        ✦
                      </Text>
                      <Text style={[styles.goldStar, styles.goldStarRight]}>
                        ✦
                      </Text>
                      <Text style={[styles.goldStar, styles.goldStarBottom]}>
                        ✦
                      </Text>
                      <Text style={[styles.goldStar, styles.goldStarLeft]}>
                        ✦
                      </Text>
                    </>
                  )}
                  <Image
                    accessibilityLabel={copy.badgeImageLabel(badge.name)}
                    source={
                      badge.imageUrl?.startsWith("https://")
                        ? { uri: badge.imageUrl }
                        : (badgeImages[
                            badge.image as keyof typeof badgeImages
                          ] ?? badgeImages["badge-gold-placeholder"])
                    }
                    style={[
                      styles.awardImage,
                      {
                        borderColor:
                          tierColors[badge.tier as keyof typeof tierColors] ??
                          tierColors.Bronze,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.awardName}>{badge.name}</Text>
              </Pressable>
            ))}
        </ScrollView>
      </View>

      <Modal
        testID="badge-modal"
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable
          onPress={() => setSelectedBadge(null)}
          testID="badge-backdrop"
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            testID="badge-details"
            style={styles.badgeDetails}
          >
            <Text style={styles.badgeDetailsTitle}>{selectedBadge?.name}</Text>
            <Text style={styles.badgeDetailsTier}>
              {copy.badgeTier(selectedBadge?.tier ?? "")}
            </Text>
            <Text style={styles.badgeDetailsDescription}>
              {selectedBadge?.description}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.closeBadge}
              onPress={() => setSelectedBadge(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>{copy.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
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
  empty: { color: "#536761", marginTop: 12, fontSize: 15 },
});
