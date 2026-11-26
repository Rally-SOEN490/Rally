// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/constants/rallyTheme";

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
  fontFamily?: string;
  // "large" for a page's main tabs, like Game set up's (RALLY-281).
  size?: "small" | "large";
};

export function SegmentedToggle<T extends string>({
  options,
  selected,
  onChange,
  fontFamily,
  size = "small",
}: Props<T>) {
  const large = size === "large";
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            // aria-selected, unlike accessibilityState, also reaches the web.
            aria-selected={isActive}
            style={[styles.segment, large && styles.segmentLarge, isActive && styles.segmentActive]}
          >
            <Text
              style={[
                styles.label,
                large && styles.labelLarge,
                { fontFamily },
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 27,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLarge: {
    height: 40,
  },
  segmentActive: {
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  labelLarge: {
    fontSize: 15,
  },
  labelActive: {
    color: colors.forest,
  },
  labelInactive: {
    color: colors.white,
  },
});
