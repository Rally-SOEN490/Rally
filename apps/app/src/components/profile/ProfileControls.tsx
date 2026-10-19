// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ProfileButton({ children, onPress, disabled = false }: {
  children: string; onPress: () => void; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled}
    accessibilityState={{ disabled }} onPress={onPress}
    style={[profileStyles.button, disabled && profileStyles.disabled]}>
    <Text style={profileStyles.buttonText}>{children}</Text>
  </Pressable>;
}
export function ProfileNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <View style={profileStyles.notice}>
    <Text accessibilityRole={error ? "alert" : undefined}
      style={[profileStyles.body, error && profileStyles.error]}>{children}</Text>
  </View>;
}
export const profileStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#e8e4df" },
  content: { padding: 20, paddingBottom: 48, gap: 18, maxWidth: 620, width: "100%", alignSelf: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#12382d" },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#12382d" },
  body: { fontSize: 15, lineHeight: 23, color: "#536761" },
  card: { padding: 20, borderRadius: 20, gap: 16, backgroundColor: "#f7f4f1" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  label: { fontSize: 16, color: "#12382d", flex: 1 },
  button: { backgroundColor: "#12382d", padding: 15, borderRadius: 999, alignItems: "center" },
  buttonText: { color: "#f7f4f1", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.45 },
  notice: { backgroundColor: "#dfe9e4", padding: 16, borderRadius: 16 },
  error: { color: "#8b2525" },
});
