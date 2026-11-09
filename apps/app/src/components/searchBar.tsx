// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { searchCopy as copy } from "@/translations/search.en";
import { colors, radii } from "@/constants/rallyTheme";

export type SearchMode = "tournaments" | "players";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onPressFilter?: () => void;
  activeFilterCount?: number;
  mode?: SearchMode;
  fontFamily?: string;
};

export function SearchBar({
  value,
  onChangeText,
  onPressFilter,
  activeFilterCount = 0,
  mode = "tournaments",
  fontFamily,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={24} color={colors.textMuted} />

      <TextInput
        style={[styles.input, { fontFamily }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={copy.placeholders[mode]}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
      />

      <Pressable
        onPress={onPressFilter}
        accessibilityRole="button"
        accessibilityLabel={onPressFilter ? copy.openFilters : copy.filtersUnavailable}
        accessibilityState={{ disabled: !onPressFilter }}
        disabled={!onPressFilter}
        style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
      >
        <Ionicons name="options-outline" size={22} color={colors.gold} />
        {activeFilterCount > 0 && (
          <View
            style={styles.filterBadge}
            accessibilityLabel={copy.activeFilters(activeFilterCount)}
          >
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingLeft: 16,
    paddingRight: 8,
    height: 61,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  filterButton: {
    position: "relative",
    width: 38,
    height: 32,
    borderRadius: radii.button,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { color: colors.forest, fontSize: 10, fontWeight: "700" },
  pressed: {
    opacity: 0.8,
  },
});
