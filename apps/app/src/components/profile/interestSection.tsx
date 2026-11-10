// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  interestCatalog,
  interestCategories,
  visibleInterestOptions,
  type InterestCategory,
} from "@/lib/interests";

type InterestSelection = Record<InterestCategory, string[]>;

const categoryLabels: Record<InterestCategory, string> = {
  formats: "PLAY FORMATS",
  positions: "POSITIONS",
  clubs: "CLUBS",
  other: "OTHER",
};

type ToggleInterest = (category: InterestCategory, key: string) => void;

// Every selected interest with its display label, in category order.
const selectedInterests = (selection: InterestSelection) =>
  interestCategories.flatMap((category) =>
    selection[category].map((key) => ({
      category,
      key,
      label: interestCatalog[category].find((option) => option.key === key)?.label ?? key,
    })),
  );

// A selected interest. Tapping it removes it.
function SelectedInterestPill({
  category,
  interestKey,
  label,
  saving,
  onToggle,
}: {
  category: InterestCategory;
  interestKey: string;
  label: string;
  saving: boolean;
  onToggle: ToggleInterest;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: true, disabled: saving }}
      disabled={saving}
      onPress={() => onToggle(category, interestKey)}
      style={styles.pill}
    >
      <Text style={styles.pillText}>{label}</Text>
      <Text style={styles.remove}>×</Text>
    </Pressable>
  );
}

function AddInterestButton({ saving, onPress }: { saving: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add interest"
      accessibilityState={{ disabled: saving }}
      disabled={saving}
      onPress={onPress}
      style={styles.add}
    >
      <Text style={styles.addText}>+</Text>
    </Pressable>
  );
}

function ShowMoreButton({
  expanded,
  remaining,
  onPress,
}: {
  expanded: boolean;
  remaining: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={expanded ? "Show fewer interests" : `Show ${remaining} more interests`}
      onPress={onPress}
      style={styles.more}
    >
      <View style={styles.moreContent}>
        <Text style={styles.moreText}>{expanded ? "Show less" : `+${remaining} more`}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={15} color="#1d5c4d" />
      </View>
    </Pressable>
  );
}

// The options for one category in the picker, with a tick on the selected ones.
function CategoryOptions({
  category,
  selection,
  saving,
  onToggle,
}: {
  category: InterestCategory;
  selection: InterestSelection;
  saving: boolean;
  onToggle: ToggleInterest;
}) {
  return (
    <View>
      <Text style={styles.category}>{categoryLabels[category]}</Text>
      <View style={styles.options}>
        {visibleInterestOptions(category).map(({ key, label }) => {
          const isSelected = selection[category].includes(key);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected, disabled: saving }}
              disabled={saving}
              onPress={() => onToggle(category, key)}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Text style={styles.optionText}>{label}</Text>
              {isSelected && <Text style={styles.check}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// The sheet listing every interest, grouped by category.
function InterestPicker({
  visible,
  onClose,
  ...options
}: {
  visible: boolean;
  onClose: () => void;
  selection: InterestSelection;
  saving: boolean;
  onToggle: ToggleInterest;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add interests</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close interest picker"
              onPress={onClose}
            >
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <ScrollView>
            {interestCategories.map((category) => (
              <CategoryOptions key={category} category={category} {...options} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const InterestSection = ({
  selection,
  saving,
  onToggle,
}: {
  selection: InterestSelection;
  saving: boolean;
  onToggle: ToggleInterest;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const selected = selectedInterests(selection);
  const shown = expanded ? selected : selected.slice(0, 3);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Interested in</Text>
      <View style={styles.row}>
        {shown.map((interest) => (
          <SelectedInterestPill
            key={`${interest.category}-${interest.key}`}
            category={interest.category}
            interestKey={interest.key}
            label={interest.label}
            saving={saving}
            onToggle={onToggle}
          />
        ))}
        {selected.length > 3 && (
          <ShowMoreButton
            expanded={expanded}
            remaining={selected.length - shown.length}
            onPress={() => setExpanded((value) => !value)}
          />
        )}
        <AddInterestButton saving={saving} onPress={() => setPickerVisible(true)} />
      </View>
      <InterestPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        selection={selection}
        saving={saving}
        onToggle={onToggle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  title: { color: "#12382d", fontSize: 18, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: {
    alignItems: "center",
    backgroundColor: "#f2f0ed",
    borderColor: "#d9d5d0",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillText: { color: "#12382d", fontSize: 12, fontWeight: "600" },
  remove: { color: "#789087", fontSize: 14 },
  more: {
    backgroundColor: "#dfe9e4",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  moreText: { color: "#1d5c4d", fontSize: 12, fontWeight: "700" },
  moreContent: { alignItems: "center", flexDirection: "row", gap: 5 },
  add: {
    alignItems: "center",
    borderColor: "#d9d5d0",
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  addText: { color: "#1d5c4d", fontSize: 20, lineHeight: 22 },
  overlay: { backgroundColor: "rgba(0,0,0,0.35)", flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    padding: 22,
  },
  sheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sheetTitle: { color: "#12382d", fontSize: 20, fontWeight: "800" },
  close: { color: "#12382d", fontSize: 28 },
  category: {
    color: "#789087",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 18,
  },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  option: {
    alignItems: "center",
    borderColor: "#d9d5d0",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionSelected: { backgroundColor: "#dfe9e4", borderColor: "#1d5c4d" },
  optionText: { color: "#12382d", fontSize: 12, fontWeight: "600" },
  check: { color: "#1d5c4d", fontWeight: "800" },
});
