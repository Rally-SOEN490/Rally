// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, radii } from "@/constants/rallyTheme";

export type SearchMode = "tournaments" | "players";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onPressFilter?: () => void;
  mode?: SearchMode;
};

const placeholders: Record<SearchMode, string> = {
  tournaments: "Search for events, venue, organizer",
  players: "Search for name, level",
};

export function SearchBar({ value, onChangeText, onPressFilter, mode = "tournaments" }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={24} color={colors.textMuted} />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholders[mode]}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
      />

      <Pressable
        onPress={onPressFilter}
        accessibilityRole="button"
        accessibilityLabel="Open filters"
        style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
      >
        <Ionicons name="options-outline" size={22} color={colors.gold} />
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
    borderRadius: radii.card,
    paddingLeft: 16,
    paddingRight: 8,
    height: 60,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
