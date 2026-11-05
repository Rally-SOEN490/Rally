// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tournamentCopy } from "@/translations/tournaments.en";
import { GREEN, MUTED } from "./styles";

const copy = tournamentCopy.setup;

// The iPhone picker, in a full-width sheet from the bottom of the screen. Shown
// inside the field instead, it was squeezed into half the row and sat against
// the right edge. The wheel or calendar only changes the field on "Done";
// tapping outside or "Cancel" keeps the old value.
export function IosPickerSheet({
  mode,
  initial,
  label,
  onDone,
  onCancel,
}: {
  mode: "date" | "time";
  initial: Date;
  label: string;
  onDone: (date: Date) => void;
  onCancel: () => void;
}) {
  const [shown, setShown] = useState(initial);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={sheet.overlay}>
        <Pressable testID={`${label} picker backdrop`} style={sheet.backdrop} onPress={onCancel} />
        {/* Keeps the buttons and wheel clear of the iPhone's home bar. */}
        <SafeAreaView edges={["bottom"]} style={sheet.card}>
          <View style={sheet.header}>
            <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={8}>
              <Text style={sheet.cancel}>{copy.cancelPick}</Text>
            </Pressable>
            <Text style={sheet.title}>{label}</Text>
            <Pressable accessibilityRole="button" onPress={() => onDone(shown)} hitSlop={8}>
              <Text style={sheet.done}>{copy.donePick}</Text>
            </Pressable>
          </View>
          <DateTimePicker
            testID={`${label} picker`}
            value={shown}
            mode={mode}
            display={mode === "date" ? "inline" : "spinner"}
            themeVariant="light"
            onChange={(_, date) => date && setShown(date)}
            style={mode === "date" ? sheet.calendar : sheet.wheel}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(10, 20, 15, 0.45)",
  },
  card: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#101b15" },
  cancel: { fontSize: 16, color: MUTED },
  done: { fontSize: 16, fontWeight: "700", color: GREEN },
  // Centred, whatever the screen width.
  wheel: { alignSelf: "center" },
  calendar: { alignSelf: "stretch" },
});
