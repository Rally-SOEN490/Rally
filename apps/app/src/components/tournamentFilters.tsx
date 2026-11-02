// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { colors, radii } from "@/constants/rallyTheme";
import {
  DATE_RANGE_OPTIONS,
  FORMAT_OPTIONS,
  LEVEL_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SURFACE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  type TournamentFilters,
} from "@/lib/tournaments";
import { searchCopy as copy } from "@/translations/search.en";
import type { ReactNode } from "react";

type Props = {
  visible: boolean;
  filters: TournamentFilters;
  resultCount: number;
  onClose: () => void;
  onChange: (filters: TournamentFilters) => void;
  onApply: () => void;
  onClear: () => void;
};

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function toggleValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function TournamentFiltersSheet({
  visible,
  filters,
  resultCount,
  onClose,
  onChange,
  onApply,
  onClear,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.closeFilters}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.title}>{copy.filtersTitle}</Text>
            <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
              <Text style={styles.clear}>{copy.clearAll}</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <FilterGroup title={copy.filterDate}>
              {DATE_RANGE_OPTIONS.map((option) => (
                <Option
                  key={option}
                  label={copy.dateRangeLabel(option)}
                  selected={filters.dateRange === option}
                  onPress={() =>
                    onChange({
                      ...filters,
                      dateRange: filters.dateRange === option ? undefined : option,
                    })
                  }
                />
              ))}
            </FilterGroup>
            <FilterGroup title={copy.filterFormat}>
              {FORMAT_OPTIONS.map((value) => (
                <Option
                  key={value}
                  label={value}
                  selected={filters.formats.includes(value)}
                  onPress={() =>
                    onChange({ ...filters, formats: toggleValue(filters.formats, value) })
                  }
                />
              ))}
            </FilterGroup>
            <FilterGroup title={copy.filterLevel}>
              {LEVEL_OPTIONS.map((value) => (
                <Option
                  key={value}
                  label={value}
                  selected={filters.levels.includes(value)}
                  onPress={() =>
                    onChange({ ...filters, levels: toggleValue(filters.levels, value) })
                  }
                />
              ))}
            </FilterGroup>
            <FilterGroup title={copy.filterSurface}>
              {SURFACE_OPTIONS.map((value) => (
                <Option
                  key={value}
                  label={value}
                  selected={filters.surfaces.includes(value)}
                  onPress={() =>
                    onChange({ ...filters, surfaces: toggleValue(filters.surfaces, value) })
                  }
                />
              ))}
            </FilterGroup>
            <FilterGroup title={copy.filterTeamSize}>
              {TEAM_SIZE_OPTIONS.map((value) => (
                <Option
                  key={value}
                  label={copy.teamSize(value)}
                  selected={filters.teamSizes.includes(value)}
                  onPress={() =>
                    onChange({ ...filters, teamSizes: toggleValue(filters.teamSizes, value) })
                  }
                />
              ))}
            </FilterGroup>
            <FilterGroup title={copy.filterPrice}>
              {PRICE_RANGE_OPTIONS.map((value) => (
                <Option
                  key={value}
                  label={copy.priceRangeLabel(value)}
                  selected={filters.priceRange === value}
                  onPress={() =>
                    onChange({
                      ...filters,
                      priceRange: filters.priceRange === value ? undefined : value,
                    })
                  }
                />
              ))}
            </FilterGroup>
            <View style={styles.spotsRow}>
              <Text style={styles.groupTitle}>{copy.filterSpots}</Text>
              <Switch
                accessibilityLabel={copy.filterSpots}
                value={filters.spotsAvailable}
                onValueChange={(spotsAvailable) => onChange({ ...filters, spotsAvailable })}
                trackColor={{ false: "#CFCFCA", true: colors.seam }}
                thumbColor={colors.white}
              />
            </View>
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={onApply}
            style={({ pressed }) => [styles.apply, pressed && styles.pressed]}
          >
            <Text style={styles.applyText}>{copy.showResults(resultCount)}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.options}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.38)" },
  sheet: {
    maxHeight: "90%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  title: { color: colors.forest, fontSize: 20, fontWeight: "700" },
  clear: { color: colors.forest, fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  scroll: { flexShrink: 1 },
  content: { gap: 16, paddingBottom: 12 },
  group: { gap: 8 },
  groupTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  optionText: { color: colors.textPrimary, fontSize: 12 },
  optionTextSelected: { color: colors.white },
  spotsRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  apply: {
    minHeight: 48,
    borderRadius: radii.button,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  applyText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.8 },
});
