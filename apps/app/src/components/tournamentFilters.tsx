// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { colors, radii } from "@/constants/rallyTheme";
import {
  DATE_RANGE_OPTIONS,
  FORMAT_OPTIONS,
  LEVEL_OPTIONS,
  PRICE_RANGE_OPTIONS,
  TYPE_OPTIONS,
  type TournamentFilters,
} from "@/lib/tournaments";
import { searchCopy as copy } from "@/translations/search.en";
import { tournamentCopy } from "@/translations/tournaments.en";
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

// Options where at most one can be picked. Tapping the picked one clears it.
function SingleChoiceGroup<T extends string | number>({
  title,
  options,
  selected,
  label,
  onChange,
}: {
  title: string;
  options: readonly T[];
  selected: T | undefined;
  label: (option: T) => string;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <FilterGroup title={title}>
      {options.map((option) => (
        <Option
          key={option}
          label={label(option)}
          selected={selected === option}
          onPress={() => onChange(selected === option ? undefined : option)}
        />
      ))}
    </FilterGroup>
  );
}

// Options where any number can be picked.
function MultiChoiceGroup<T extends string | number>({
  title,
  options,
  selected,
  label,
  onChange,
}: {
  title: string;
  options: readonly T[];
  selected: T[];
  label: (option: T) => string;
  onChange: (values: T[]) => void;
}) {
  return (
    <FilterGroup title={title}>
      {options.map((value) => (
        <Option
          key={value}
          label={label(value)}
          selected={selected.includes(value)}
          onPress={() => onChange(toggleValue(selected, value))}
        />
      ))}
    </FilterGroup>
  );
}

// Every filter group, in the order the sheet shows them.
function FilterOptions({ filters, onChange }: Pick<Props, "filters" | "onChange">) {
  return (
    <>
      <SingleChoiceGroup
        title={copy.filterDate}
        options={DATE_RANGE_OPTIONS}
        selected={filters.dateRange}
        label={(option) => copy.dateRangeLabel(option)}
        onChange={(dateRange) => onChange({ ...filters, dateRange })}
      />
      <MultiChoiceGroup
        title={copy.filterFormat}
        options={FORMAT_OPTIONS}
        selected={filters.formats}
        label={(value) => value}
        onChange={(formats) => onChange({ ...filters, formats })}
      />
      <MultiChoiceGroup
        title={copy.filterType}
        options={TYPE_OPTIONS}
        selected={filters.types}
        label={(value) => tournamentCopy.divisions.types[value]}
        onChange={(types) => onChange({ ...filters, types })}
      />
      <MultiChoiceGroup
        title={copy.filterLevel}
        options={LEVEL_OPTIONS}
        selected={filters.levels}
        label={(value) => value}
        onChange={(levels) => onChange({ ...filters, levels })}
      />
      <SingleChoiceGroup
        title={copy.filterPrice}
        options={PRICE_RANGE_OPTIONS}
        selected={filters.priceRange}
        label={(value) => copy.priceRangeLabel(value)}
        onChange={(priceRange) => onChange({ ...filters, priceRange })}
      />
    </>
  );
}

function SheetHeader({ onClear }: { onClear: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{copy.filtersTitle}</Text>
      <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
        <Text style={styles.clear}>{copy.clearAll}</Text>
      </Pressable>
    </View>
  );
}

function SpotsAvailableSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.spotsRow}>
      <Text style={styles.groupTitle}>{copy.filterSpots}</Text>
      <Switch
        accessibilityLabel={copy.filterSpots}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#CFCFCA", true: colors.seam }}
        thumbColor={colors.white}
      />
    </View>
  );
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
          <SheetHeader onClear={onClear} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <FilterOptions filters={filters} onChange={onChange} />
            <SpotsAvailableSwitch
              value={filters.spotsAvailable}
              onChange={(spotsAvailable) => onChange({ ...filters, spotsAvailable })}
            />
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
