// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Badge } from "@/lib/badges";
import { sharedStyles } from "./styles";

// The name, tier and description of the badge the player tapped.
export function BadgeDetailsModal({
  badge,
  onClose,
}: {
  badge: Badge | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={badge !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={sharedStyles.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss badge details"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badgeDetails}>
          <Text style={styles.badgeDetailsTitle}>{badge?.name}</Text>
          <Text style={styles.badgeDetailsTier}>{badge?.tier} tier</Text>
          <Text style={styles.badgeDetailsDescription}>{badge?.description}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close badge details"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
});
