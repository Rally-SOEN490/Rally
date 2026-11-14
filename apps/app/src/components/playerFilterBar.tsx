// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { PlayerFilters, PlayerSort } from "@/lib/player-filters";
import { PLAYER_INTEREST_OPTIONS, PLAYER_POSITIONS } from "@/lib/player-preferences";
import type { SearchFonts } from "@/lib/search-fonts";
import { playerFilterCopy as copy } from "@/translations/player-filters.en";

type Props = {
  filters: PlayerFilters;
  sort: PlayerSort;
  fonts: SearchFonts;
  onRemove: (group: keyof PlayerFilters, value: string) => void;
  onSort: (sort: PlayerSort) => void;
};
const sorts = [
  { key: "recommended", label: copy.recommended },
  { key: "name", label: copy.nameAscending },
] as const;

export function PlayerFilterBar({ filters, sort, fonts, onRemove, onSort }: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const chips = [
    ...filters.levels.map((value) => ({ group: "levels" as const, value, label: value })),
    ...filters.positions.map((value) => ({
      group: "positions" as const,
      value,
      label: PLAYER_POSITIONS.find((option) => option.key === value)!.label,
    })),
    ...filters.interests.map((value) => ({
      group: "interests" as const,
      value,
      label: PLAYER_INTEREST_OPTIONS.find((option) => option.key === value)!.label,
    })),
  ];
  return (
    <View style={styles.row}>
      <View style={styles.chips}>
        {chips.map(({ group, value, label }) => (
          <Pressable
            key={`${group}:${value}`}
            accessibilityRole="button"
            accessibilityLabel={copy.removeFilter(label)}
            onPress={() => onRemove(group, value)}
            style={styles.chip}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Image
              source={require("@/assets/images/player-filters/interest-dot.svg")}
              style={styles.dot}
              contentFit="contain"
            />
            <Text style={[styles.chipText, { fontFamily: fonts.semibold }]}>{label}</Text>
            <Image
              source={require("@/assets/images/player-filters/remove.svg")}
              style={styles.remove}
              contentFit="contain"
            />
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.sortTitle}: ${sorts.find((option) => option.key === sort)!.label}`}
        accessibilityHint={copy.sortHint}
        onPress={() => setSortOpen(true)}
        style={styles.sort}
        hitSlop={8}
      >
        <Text style={[styles.sortLabel, { fontFamily: fonts.semibold }]}>
          {sorts.find((option) => option.key === sort)!.label}
        </Text>
        <Image
          source={require("@/assets/images/player-filters/sort-caret.svg")}
          style={styles.caret}
          contentFit="contain"
        />
      </Pressable>
      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSortOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={copy.closeSort}
          />
          <View style={styles.menu} accessibilityViewIsModal>
            <Text
              accessibilityRole="header"
              style={[styles.menuTitle, { fontFamily: fonts.semibold }]}
            >
              {copy.sortTitle}
            </Text>
            {sorts.map(({ key, label }) => (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ checked: sort === key }}
                onPress={() => {
                  onSort(key);
                  setSortOpen(false);
                }}
                style={[styles.menuOption, sort === key && styles.selected]}
              >
                <Text style={[styles.sortLabel, { fontFamily: fonts.medium }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 5,
    minHeight: 26,
  },
  chips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 5 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 25,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#d5d5d5",
    borderRadius: 15,
    backgroundColor: "#fff",
  },
  chipText: { color: "#000", fontSize: 10 },
  dot: { width: 9, height: 9 },
  remove: { width: 6.64842, height: 6.64842 },
  sort: { flexDirection: "row", alignItems: "center", minHeight: 25 },
  sortLabel: { color: "#000", fontSize: 12 },
  caret: { width: 17, height: 17 },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  menu: { backgroundColor: "#ecebe6", padding: 16, borderRadius: 15, gap: 8, width: 260 },
  menuTitle: { fontSize: 16, color: "#1e4a37", paddingBottom: 8 },
  menuOption: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 8 },
  selected: { backgroundColor: "#d9ec7a" },
});
