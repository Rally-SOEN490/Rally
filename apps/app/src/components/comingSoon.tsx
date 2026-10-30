// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// A placeholder for tabs whose screens haven't been built yet.
export function ComingSoon({
  title,
  icon,
  message,
}: {
  title: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  message: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={28} color="#12382d" />
        </View>
        <Text style={styles.heading}>Coming soon</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8e4df",
    paddingHorizontal: 16,
    paddingBottom: 110, // room for the floating nav bar
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#12382d",
    marginTop: 16,
  },
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dfe9e4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#12382d",
  },
  message: {
    fontSize: 14,
    color: "#536761",
    textAlign: "center",
    maxWidth: 280,
  },
});
