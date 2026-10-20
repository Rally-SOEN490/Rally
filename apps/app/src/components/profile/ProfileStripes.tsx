// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { StyleSheet, View } from "react-native";

export function ProfileStripes({ color = "rgba(255,255,255,0.07)" }: { color?: string }) {
  return <View pointerEvents="none" accessible={false} style={styles.pattern}>
    {Array.from({ length: 40 }, (_, index) => <View key={index}
      style={[styles.stripe, { left: index * 18 - 90, backgroundColor: color }]} />)}
  </View>;
}
const styles = StyleSheet.create({
  pattern: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  stripe: { position: "absolute", top: -100, width: 8, height: 360, transform: [{ rotate: "42deg" }] },
});
