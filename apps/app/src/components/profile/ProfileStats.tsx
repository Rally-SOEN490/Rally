// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { StyleSheet, Text, View } from "react-native";
import { ProfileIcon } from "./ProfileIcon";
import { profileCopy as copy } from "@/locales/en/profile";

export function ProfileStats() {
  const stats = [
    { label: copy.matches, icon: "ball", color: "#365c4a" },
    { label: copy.wins, icon: "wins", color: "#c3a13d" },
    { label: copy.topFour, icon: "top", color: "#92a348" },
    { label: copy.events, icon: "calendar", color: "#4c6c60" },
  ] as const;
  return <View style={styles.row}>{stats.map(stat => <View key={stat.label}
    accessible accessibilityLabel={`${stat.label}: ${copy.unavailable}`} style={styles.card}>
    <ProfileIcon name={stat.icon} size={13} color={stat.color} />
    <Text style={styles.value}>—</Text><Text style={styles.label}>{stat.label}</Text>
    <View style={styles.watermark}><ProfileIcon name={stat.icon} size={32} color="#f0f2e8" /></View>
  </View>)}</View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  card: { flex: 1, minWidth: 0, backgroundColor: "#fff", borderRadius: 16, padding: 10, overflow: "hidden", boxShadow: "0px 3px 8px rgba(28,57,43,0.04)" },
  value: { color: "#172e25", fontSize: 21, fontWeight: "800", marginTop: 2 },
  label: { color: "#43594f", fontSize: 9 },
  watermark: { position: "absolute", right: -5, bottom: 1, zIndex: -1 },
});
